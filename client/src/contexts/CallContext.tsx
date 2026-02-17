import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active'
export type CallType = 'audio' | 'video'

export interface CallPeer {
  id: string
  name: string
  avatar?: string
}

export interface RemotePeerStream {
  stream: MediaStream
  name: string
  avatar?: string
}

interface CallContextType {
  callStatus: CallStatus
  callType: CallType
  callInfo: { roomId: string; callerName: string; callerAvatar?: string; groupName?: string } | null
  localStream: MediaStream | null
  remoteStreams: Map<string, RemotePeerStream>
  isMuted: boolean
  isCameraOff: boolean
  callDuration: number
  participantCount: number
  startCall: (participants: CallPeer[], type: CallType, groupName?: string) => void
  acceptCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleCamera: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket()
  const { user } = useAuth()

  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callType, setCallType] = useState<CallType>('audio')
  const [callInfo, setCallInfo] = useState<{
    roomId: string; callerName: string; callerAvatar?: string; groupName?: string
  } | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemotePeerStream>>(new Map())
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [participantCount, setParticipantCount] = useState(0)

  // Refs for stable access inside callbacks
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roomIdRef = useRef<string | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callTypeRef = useRef<CallType>('audio')
  const callStatusRef = useRef<CallStatus>('idle')

  // Keep refs in sync with state
  useEffect(() => { localStreamRef.current = localStream }, [localStream])
  useEffect(() => { callTypeRef.current = callType }, [callType])
  useEffect(() => { callStatusRef.current = callStatus }, [callStatus])

  const cleanup = useCallback(() => {
    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close())
    peerConnectionsRef.current.clear()
    pendingCandidatesRef.current.clear()

    // Leave call room
    if (socket && roomIdRef.current && user) {
      socket.emit('leaveCallRoom', { roomId: roomIdRef.current, userId: user.id })
    }

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    roomIdRef.current = null
    setLocalStream(null)
    setRemoteStreams(new Map())
    setCallStatus('idle')
    setCallInfo(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setCallDuration(0)
    setParticipantCount(0)
  }, [socket, user])

  const getMediaStream = useCallback(async (type: CallType): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    })
  }, [])

  const createPeerConnection = useCallback((peerId: string, peerName: string, peerAvatar?: string) => {
    // Close existing connection if any
    const existingPc = peerConnectionsRef.current.get(peerId)
    if (existingPc) {
      existingPc.close()
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomIdRef.current && user) {
        socket.emit('iceCandidate', {
          roomId: roomIdRef.current,
          to: peerId,
          from: user.id,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const updated = new Map(prev)
        updated.set(peerId, {
          stream: event.streams[0],
          name: peerName,
          avatar: peerAvatar,
        })
        return updated
      })
      setParticipantCount(prev => {
        const newCount = peerConnectionsRef.current.size
        return newCount > prev ? newCount : prev
      })
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.close()
        peerConnectionsRef.current.delete(peerId)
        setRemoteStreams(prev => {
          const updated = new Map(prev)
          updated.delete(peerId)
          return updated
        })
      }
    }

    // Add local tracks
    const stream = localStreamRef.current
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
    }

    peerConnectionsRef.current.set(peerId, pc)
    return pc
  }, [socket, user])

  const processPendingCandidates = useCallback(async (peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId)
    const pending = pendingCandidatesRef.current.get(peerId)
    if (pc && pc.remoteDescription && pending && pending.length > 0) {
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err)
        }
      }
      pendingCandidatesRef.current.delete(peerId)
    }
  }, [])

  // Start a call (1-on-1 or group)
  const startCall = useCallback((participants: CallPeer[], type: CallType, groupName?: string) => {
    if (!socket || !user || callStatusRef.current !== 'idle') return

    const roomId = `${user.id}-${Date.now()}`
    roomIdRef.current = roomId

    setCallType(type)
    setCallInfo({ roomId, callerName: user.name, callerAvatar: user.avatar, groupName })
    setCallStatus('outgoing')

    getMediaStream(type).then((stream) => {
      localStreamRef.current = stream
      setLocalStream(stream)

      // Emit startCall to server which invites all participants
      socket.emit('startCall', {
        roomId,
        from: user.id,
        participants: participants.map(p => p.id),
        callerName: user.name,
        callerAvatar: user.avatar,
        callType: type,
        groupName,
      })

      // Caller also joins the call room
      socket.emit('joinCallRoom', {
        roomId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
      })
    }).catch((err) => {
      console.error('Error getting media stream:', err)
      cleanup()
    })
  }, [socket, user, getMediaStream, cleanup])

  // Accept an incoming call
  const acceptCall = useCallback(() => {
    if (!socket || !user || !callInfo) return

    setCallStatus('active')

    getMediaStream(callTypeRef.current).then((stream) => {
      localStreamRef.current = stream
      setLocalStream(stream)

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

      // Join the call room — server will tell us about existing peers
      socket.emit('joinCallRoom', {
        roomId: callInfo.roomId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
      })
    }).catch((err) => {
      console.error('Error getting media stream:', err)
      cleanup()
    })
  }, [socket, user, callInfo, getMediaStream, cleanup])

  const rejectCall = useCallback(() => {
    if (!socket || !callInfo || !user) return
    socket.emit('rejectCall', {
      roomId: callInfo.roomId,
      userId: user.id,
      to: callInfo.callerName, // we use the caller's ID from callInfo
    })
    // We stored the caller userId in callInfo - need to find it
    // The "from" user id is embedded in the roomId (format: <callerId>-<timestamp>)
    const callerId = callInfo.roomId.split('-').slice(0, -1).join('-')
    socket.emit('rejectCall', {
      roomId: callInfo.roomId,
      userId: user.id,
      to: callerId,
    })
    cleanup()
  }, [socket, callInfo, user, cleanup])

  const endCall = useCallback(() => {
    cleanup()
  }, [cleanup])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraOff(prev => !prev)
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return

    // Incoming call from another user
    const handleIncomingCall = (data: {
      roomId: string
      from: string
      callerName: string
      callerAvatar?: string
      callType: CallType
      groupName?: string
    }) => {
      if (callStatusRef.current !== 'idle') {
        socket.emit('rejectCall', { roomId: data.roomId, userId: user.id, to: data.from })
        return
      }

      roomIdRef.current = data.roomId
      setCallType(data.callType)
      setCallInfo({
        roomId: data.roomId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        groupName: data.groupName,
      })
      setCallStatus('incoming')
    }

    // Server tells us about existing peers when we join a room
    const handleExistingPeers = async (data: { roomId: string; peers: string[] }) => {
      // For each existing peer, create a connection and send an offer
      for (const peerId of data.peers) {
        try {
          const pc = createPeerConnection(peerId, peerId)

          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          socket.emit('callOffer', {
            roomId: data.roomId,
            to: peerId,
            from: user.id,
            offer,
          })
        } catch (err) {
          console.error(`Error creating offer for peer ${peerId}:`, err)
        }
      }
    }

    // A new peer joined the room — wait for their offer
    const handlePeerJoined = (_data: {
      roomId: string
      userId: string
      userName: string
      userAvatar?: string
    }) => {
      // If we were the caller and in outgoing state, move to active
      if (callStatusRef.current === 'outgoing') {
        setCallStatus('active')
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)
      }
      setParticipantCount(prev => prev + 1)
    }

    // Receive an offer from a peer
    const handleCallOffer = async (data: {
      roomId: string
      from: string
      offer: RTCSessionDescriptionInit
    }) => {
      try {
        const pc = createPeerConnection(data.from, data.from)

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
        await processPendingCandidates(data.from)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        socket.emit('callAnswer', {
          roomId: data.roomId,
          to: data.from,
          from: user.id,
          answer,
        })
      } catch (err) {
        console.error('Error handling call offer:', err)
      }
    }

    // Receive an answer from a peer
    const handleCallAnswer = async (data: {
      roomId: string
      from: string
      answer: RTCSessionDescriptionInit
    }) => {
      const pc = peerConnectionsRef.current.get(data.from)
      if (!pc) return

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        await processPendingCandidates(data.from)
      } catch (err) {
        console.error('Error handling call answer:', err)
      }
    }

    // Receive ICE candidate from a peer
    const handleIceCandidate = async (data: {
      roomId: string
      from: string
      candidate: RTCIceCandidateInit
    }) => {
      const pc = peerConnectionsRef.current.get(data.from)
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
          console.error('Error adding ICE candidate:', err)
        }
      } else {
        // Queue candidate
        const pending = pendingCandidatesRef.current.get(data.from) || []
        pending.push(data.candidate)
        pendingCandidatesRef.current.set(data.from, pending)
      }
    }

    // A peer left the call
    const handlePeerLeft = (data: { roomId: string; userId: string }) => {
      const pc = peerConnectionsRef.current.get(data.userId)
      if (pc) {
        pc.close()
        peerConnectionsRef.current.delete(data.userId)
      }
      pendingCandidatesRef.current.delete(data.userId)

      setRemoteStreams(prev => {
        const updated = new Map(prev)
        updated.delete(data.userId)
        return updated
      })
      setParticipantCount(peerConnectionsRef.current.size)

      // If no more peers, end the call
      if (peerConnectionsRef.current.size === 0 && callStatusRef.current === 'active') {
        cleanup()
      }
    }

    const handleCallRejected = (_data: { roomId: string; userId: string }) => {
      // If it was a 1-on-1 call and the only participant rejected, end call
      if (peerConnectionsRef.current.size === 0 && callStatusRef.current === 'outgoing') {
        cleanup()
      }
    }

    const handleCallUnavailable = (_data: { roomId: string; reason: string }) => {
      if (callStatusRef.current === 'outgoing') {
        cleanup()
      }
    }

    socket.on('incomingCall', handleIncomingCall)
    socket.on('existingPeers', handleExistingPeers)
    socket.on('peerJoined', handlePeerJoined)
    socket.on('callOffer', handleCallOffer)
    socket.on('callAnswer', handleCallAnswer)
    socket.on('iceCandidate', handleIceCandidate)
    socket.on('peerLeft', handlePeerLeft)
    socket.on('callRejected', handleCallRejected)
    socket.on('callUnavailable', handleCallUnavailable)

    return () => {
      socket.off('incomingCall', handleIncomingCall)
      socket.off('existingPeers', handleExistingPeers)
      socket.off('peerJoined', handlePeerJoined)
      socket.off('callOffer', handleCallOffer)
      socket.off('callAnswer', handleCallAnswer)
      socket.off('iceCandidate', handleIceCandidate)
      socket.off('peerLeft', handlePeerLeft)
      socket.off('callRejected', handleCallRejected)
      socket.off('callUnavailable', handleCallUnavailable)
    }
  }, [socket, user, createPeerConnection, processPendingCandidates, cleanup])

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        callInfo,
        localStream,
        remoteStreams,
        isMuted,
        isCameraOff,
        callDuration,
        participantCount,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}
