import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active'
export type CallType = 'audio' | 'video'

interface CallPeer {
  id: string
  name: string
  avatar?: string
}

interface CallContextType {
  callStatus: CallStatus
  callType: CallType
  remotePeer: CallPeer | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isCameraOff: boolean
  callDuration: number
  startCall: (peer: CallPeer, type: CallType) => Promise<void>
  acceptCall: () => Promise<void>
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
  const [remotePeer, setRemotePeer] = useState<CallPeer | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)

  const cleanup = useCallback(() => {
    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    setLocalStream(null)
    setRemoteStream(null)

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    pendingCandidatesRef.current = []
    incomingOfferRef.current = null
    setCallStatus('idle')
    setRemotePeer(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setCallDuration(0)
  }, [localStream])

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          to: peerId,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanup()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [socket, cleanup])

  const getMediaStream = useCallback(async (type: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video',
    }
    return navigator.mediaDevices.getUserMedia(constraints)
  }, [])

  const startCall = useCallback(async (peer: CallPeer, type: CallType) => {
    if (!socket || !user || callStatus !== 'idle') return

    try {
      setCallType(type)
      setRemotePeer(peer)
      setCallStatus('outgoing')

      const stream = await getMediaStream(type)
      setLocalStream(stream)

      const pc = createPeerConnection(peer.id)

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit('callUser', {
        from: user.id,
        to: peer.id,
        offer,
        callerName: user.name,
        callerAvatar: user.avatar,
        callType: type,
      })
    } catch (err) {
      console.error('Error starting call:', err)
      cleanup()
    }
  }, [socket, user, callStatus, getMediaStream, createPeerConnection, cleanup])

  const acceptCall = useCallback(async () => {
    if (!socket || !remotePeer || !incomingOfferRef.current) return

    try {
      setCallStatus('active')

      const stream = await getMediaStream(callType)
      setLocalStream(stream)

      const pc = createPeerConnection(remotePeer.id)

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Set remote description from offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current))

      // Process any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
      pendingCandidatesRef.current = []

      // Create and send answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('answerCall', {
        to: remotePeer.id,
        answer,
      })

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accepting call:', err)
      cleanup()
    }
  }, [socket, remotePeer, callType, getMediaStream, createPeerConnection, cleanup])

  const rejectCall = useCallback(() => {
    if (!socket || !remotePeer) return
    socket.emit('rejectCall', { to: remotePeer.id })
    cleanup()
  }, [socket, remotePeer, cleanup])

  const endCall = useCallback(() => {
    if (!socket || !remotePeer) return
    socket.emit('endCall', { to: remotePeer.id })
    cleanup()
  }, [socket, remotePeer, cleanup])

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
  }, [localStream])

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraOff(prev => !prev)
    }
  }, [localStream])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleIncomingCall = (data: {
      from: string
      offer: RTCSessionDescriptionInit
      callerName: string
      callerAvatar?: string
      callType: CallType
    }) => {
      // Only accept incoming call if idle
      if (callStatus !== 'idle') {
        socket.emit('rejectCall', { to: data.from })
        return
      }

      incomingOfferRef.current = data.offer
      setCallType(data.callType)
      setRemotePeer({
        id: data.from,
        name: data.callerName,
        avatar: data.callerAvatar,
      })
      setCallStatus('incoming')
    }

    const handleCallAnswered = async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current
      if (!pc) return

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))

        // Process any pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
        pendingCandidatesRef.current = []

        setCallStatus('active')

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('Error handling call answer:', err)
        cleanup()
      }
    }

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
          console.error('Error adding ICE candidate:', err)
        }
      } else {
        // Queue candidate if remote description not yet set
        pendingCandidatesRef.current.push(data.candidate)
      }
    }

    const handleCallEnded = () => {
      cleanup()
    }

    const handleCallRejected = () => {
      cleanup()
    }

    const handleCallUnavailable = (data: { reason: string }) => {
      console.warn('Call unavailable:', data.reason)
      cleanup()
    }

    socket.on('incomingCall', handleIncomingCall)
    socket.on('callAnswered', handleCallAnswered)
    socket.on('iceCandidate', handleIceCandidate)
    socket.on('callEnded', handleCallEnded)
    socket.on('callRejected', handleCallRejected)
    socket.on('callUnavailable', handleCallUnavailable)

    return () => {
      socket.off('incomingCall', handleIncomingCall)
      socket.off('callAnswered', handleCallAnswered)
      socket.off('iceCandidate', handleIceCandidate)
      socket.off('callEnded', handleCallEnded)
      socket.off('callRejected', handleCallRejected)
      socket.off('callUnavailable', handleCallUnavailable)
    }
  }, [socket, callStatus, cleanup])

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        remotePeer,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callDuration,
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
