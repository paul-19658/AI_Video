import { useEffect, useRef } from 'react'

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked, silently ignore
      })
    }
  }, [])

  return (
    <>
      <div className="video-background">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/dreamweaver/uploads/西游1.mp4" type="video/mp4" />
          您的浏览器不支持视频播放
        </video>
      </div>
      <div className="video-overlay" />
    </>
  )
}

export default VideoBackground
