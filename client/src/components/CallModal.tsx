import { useEffect, useRef, useMemo } from 'react'
import { useCall, RemotePeerStream } from '../contexts/CallContext'
import {
  FiPhone,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiUsers,
} from 'react-icons/fi'

const RemoteVideo = ({ peerStream }: { peerStream: RemotePeerStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && peerStream.stream) {
      videoRef.current.srcObject = peerStream.stream
    }
  }, [peerStream.stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

const RemoteAudio = ({ peerStream }: { peerStream: RemotePeerStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current && peerStream.stream) {
      audioRef.current.srcObject = peerStream.stream
    }
  }, [peerStream.stream])

  return <audio ref={audioRef} autoPlay />
}

const CallModal = () => {
  const {
    callStatus,
    callType,
    callInfo,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    callDuration,
    participantCount,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall()

  const localVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  const remoteEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams])
  const isGroupCall = participantCount > 1 || (callInfo?.groupName != null)

  if (callStatus === 'idle') return null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = callInfo?.groupName || callInfo?.callerName || 'Call'
  const isVideoCall = callType === 'video'

  // Grid columns based on participant count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1'
    if (count <= 2) return 'grid-cols-2'
    if (count <= 4) return 'grid-cols-2 grid-rows-2'
    if (count <= 6) return 'grid-cols-3 grid-rows-2'
    return 'grid-cols-3 grid-rows-3'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`relative flex flex-col items-center justify-between rounded-2xl shadow-2xl overflow-hidden ${
        isVideoCall && callStatus === 'active'
          ? 'w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-6xl bg-gray-900'
          : 'w-96 bg-gradient-to-b from-gray-800 to-gray-900 p-8'
      }`}>

        {/* ===== ACTIVE VIDEO CALL ===== */}
        {callStatus === 'active' && isVideoCall && (
          <>
            {/* Remote video grid */}
            <div className={`absolute inset-0 grid ${getGridClass(remoteEntries.length)} gap-1 bg-gray-900`}>
              {remoteEntries.map(([peerId, peerStream]) => (
                <div key={peerId} className="relative w-full h-full bg-gray-800 overflow-hidden">
                  <RemoteVideo peerStream={peerStream} />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {peerStream.name || peerId.slice(0, 8)}
                  </div>
                </div>
              ))}
              {remoteEntries.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="animate-pulse">Waiting for participants...</p>
                </div>
              )}
            </div>

            {/* Local video PIP */}
            <div className="absolute top-4 right-4 w-32 h-44 md:w-44 md:h-60 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 bg-gray-800 z-10">
              {isCameraOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <FiVideoOff size={28} className="text-gray-400" />
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                You
              </div>
            </div>

            {/* Call info overlay */}
            <div className="absolute top-4 left-4 z-10 text-white">
              <div className="flex items-center space-x-2">
                {isGroupCall && <FiUsers size={16} className="text-green-400" />}
                <h3 className="text-lg font-semibold drop-shadow-lg">{displayName}</h3>
              </div>
              <p className="text-sm text-green-400 drop-shadow-lg">
                {formatDuration(callDuration)}
                {isGroupCall && ` · ${remoteEntries.length + 1} participants`}
              </p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <FiMicOff size={24} className="text-white" /> : <FiMic size={24} className="text-white" />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
                title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? <FiVideoOff size={24} className="text-white" /> : <FiVideo size={24} className="text-white" />}
              </button>

              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg"
                title="End call"
              >
                <FiPhoneOff size={24} className="text-white" />
              </button>
            </div>
          </>
        )}

        {/* ===== ACTIVE AUDIO CALL ===== */}
        {callStatus === 'active' && !isVideoCall && (
          <>
            {/* Hidden audio elements for each remote stream */}
            {remoteEntries.map(([peerId, peerStream]) => (
              <RemoteAudio key={peerId} peerStream={peerStream} />
            ))}

            <div className="flex flex-col items-center py-8 space-y-6">
              {/* Participant avatars */}
              {isGroupCall ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center -space-x-3">
                    {remoteEntries.slice(0, 4).map(([peerId, peerStream]) => (
                      <div
                        key={peerId}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-gray-800"
                      >
                        {peerStream.avatar ? (
                          <img src={peerStream.avatar} alt={peerStream.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          getInitials(peerStream.name || '?')
                        )}
                      </div>
                    ))}
                    {remoteEntries.length > 4 && (
                      <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-gray-800">
                        +{remoteEntries.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <FiUsers size={14} />
                    <span>{remoteEntries.length + 1} participants</span>
                  </div>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-green-400/30">
                  {remoteEntries.length > 0 && remoteEntries[0][1].avatar ? (
                    <img src={remoteEntries[0][1].avatar} alt={remoteEntries[0][1].name} className="w-28 h-28 rounded-full object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">{displayName}</h3>
                <p className="text-sm text-green-400 mt-1">{formatDuration(callDuration)}</p>
              </div>

              {/* Audio wave animation */}
              <div className="flex items-end space-x-1 h-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-green-400 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-6 pt-4">
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <FiMicOff size={24} className="text-white" /> : <FiMic size={24} className="text-white" />}
                </button>

                <button
                  onClick={endCall}
                  className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg"
                  title="End call"
                >
                  <FiPhoneOff size={28} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===== INCOMING CALL ===== */}
        {callStatus === 'incoming' && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-green-400/20 animate-ping" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {callInfo?.groupName ? (
                  <FiUsers size={40} />
                ) : callInfo?.callerAvatar ? (
                  <img src={callInfo.callerAvatar} alt={callInfo.callerName} className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  getInitials(callInfo?.callerName || '')
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-gray-300 mt-1">
                Incoming {callInfo?.groupName ? 'group ' : ''}{callType === 'video' ? 'video' : 'voice'} call...
              </p>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <button onClick={rejectCall} className="flex flex-col items-center space-y-2 group">
                <div className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg group-hover:scale-110">
                  <FiPhoneOff size={28} className="text-white" />
                </div>
                <span className="text-xs text-gray-400">Decline</span>
              </button>

              <button onClick={acceptCall} className="flex flex-col items-center space-y-2 group">
                <div className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-all shadow-lg group-hover:scale-110">
                  {callType === 'video' ? <FiVideo size={28} className="text-white" /> : <FiPhone size={28} className="text-white" />}
                </div>
                <span className="text-xs text-gray-400">Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* ===== OUTGOING CALL ===== */}
        {callStatus === 'outgoing' && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {callInfo?.groupName ? (
                  <FiUsers size={40} />
                ) : callInfo?.callerAvatar ? (
                  <img src={callInfo.callerAvatar} alt={callInfo.callerName} className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  getInitials(displayName)
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-gray-300 mt-1 animate-pulse">
                {callInfo?.groupName ? 'Starting group call...' : 'Calling...'}
              </p>
            </div>

            <div className="pt-4">
              <button onClick={endCall} className="flex flex-col items-center space-y-2 group">
                <div className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg group-hover:scale-110">
                  <FiPhoneOff size={28} className="text-white" />
                </div>
                <span className="text-xs text-gray-400">Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CallModal
