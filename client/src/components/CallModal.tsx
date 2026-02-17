import { useEffect, useRef } from 'react'
import { useCall } from '../contexts/CallContext'
import {
  FiPhone,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
} from 'react-icons/fi'

const CallModal = () => {
  const {
    callStatus,
    callType,
    remotePeer,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

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

  const isVideoCall = callType === 'video'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`relative flex flex-col items-center justify-between rounded-2xl shadow-2xl overflow-hidden ${
        isVideoCall && callStatus === 'active'
          ? 'w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-5xl bg-gray-900'
          : 'w-96 bg-gradient-to-b from-gray-800 to-gray-900 p-8'
      }`}>

        {/* Active Video Call */}
        {callStatus === 'active' && isVideoCall && (
          <>
            {/* Remote video (full screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Local video (picture-in-picture) */}
            <div className="absolute top-4 right-4 w-36 h-48 md:w-48 md:h-64 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 bg-gray-800 z-10">
              {isCameraOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <FiVideoOff size={32} className="text-gray-400" />
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
            </div>

            {/* Call info overlay */}
            <div className="absolute top-4 left-4 z-10 text-white">
              <h3 className="text-lg font-semibold drop-shadow-lg">{remotePeer?.name}</h3>
              <p className="text-sm text-green-400 drop-shadow-lg">{formatDuration(callDuration)}</p>
            </div>

            {/* Controls at bottom */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <FiMicOff size={24} className="text-white" />
                ) : (
                  <FiMic size={24} className="text-white" />
                )}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
                title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? (
                  <FiVideoOff size={24} className="text-white" />
                ) : (
                  <FiVideo size={24} className="text-white" />
                )}
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

        {/* Active Audio Call */}
        {callStatus === 'active' && !isVideoCall && (
          <>
            {/* Hidden audio elements */}
            <audio ref={remoteVideoRef as React.RefObject<HTMLAudioElement>} autoPlay />

            <div className="flex flex-col items-center py-8 space-y-6">
              {/* Avatar */}
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-green-400/30">
                {remotePeer?.avatar ? (
                  <img src={remotePeer.avatar} alt={remotePeer.name} className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  getInitials(remotePeer?.name || '')
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">{remotePeer?.name}</h3>
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
                  {isMuted ? (
                    <FiMicOff size={24} className="text-white" />
                  ) : (
                    <FiMic size={24} className="text-white" />
                  )}
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

        {/* Incoming Call */}
        {callStatus === 'incoming' && (
          <div className="flex flex-col items-center py-8 space-y-6">
            {/* Pulsing ring effect */}
            <div className="relative">
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-green-400/20 animate-ping" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {remotePeer?.avatar ? (
                  <img src={remotePeer.avatar} alt={remotePeer.name} className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  getInitials(remotePeer?.name || '')
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{remotePeer?.name}</h3>
              <p className="text-sm text-gray-300 mt-1">
                Incoming {callType === 'video' ? 'video' : 'voice'} call...
              </p>
            </div>

            {/* Accept / Reject */}
            <div className="flex items-center space-x-8 pt-4">
              <button
                onClick={rejectCall}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg group-hover:scale-110">
                  <FiPhoneOff size={28} className="text-white" />
                </div>
                <span className="text-xs text-gray-400">Decline</span>
              </button>

              <button
                onClick={acceptCall}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-all shadow-lg group-hover:scale-110">
                  {callType === 'video' ? (
                    <FiVideo size={28} className="text-white" />
                  ) : (
                    <FiPhone size={28} className="text-white" />
                  )}
                </div>
                <span className="text-xs text-gray-400">Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* Outgoing Call */}
        {callStatus === 'outgoing' && (
          <div className="flex flex-col items-center py-8 space-y-6">
            {/* Pulsing ring */}
            <div className="relative">
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-teal flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {remotePeer?.avatar ? (
                  <img src={remotePeer.avatar} alt={remotePeer.name} className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  getInitials(remotePeer?.name || '')
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">{remotePeer?.name}</h3>
              <p className="text-sm text-gray-300 mt-1 animate-pulse">
                Calling...
              </p>
            </div>

            {/* Cancel */}
            <div className="pt-4">
              <button
                onClick={endCall}
                className="flex flex-col items-center space-y-2 group"
              >
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
