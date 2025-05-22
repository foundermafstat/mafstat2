"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

const TRACKS = [
  { name: "Track 1", src: "/music/track1.mp3" },
  { name: "Track 2", src: "/music/track2.mp3" },
  { name: "Track 3", src: "/music/track3.mp3" },
]

export function GameTimer() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTrackChange = (index: number) => {
    setCurrentTrack(index)
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = TRACKS[index].src
      audioRef.current.play()
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Game Timer</h2>
        <div className="text-4xl font-mono">{formatTime(time)}</div>
        <div className="space-x-4">
          <Button onClick={handleStart} disabled={isRunning}>
            Start
          </Button>
          <Button onClick={handlePause} disabled={!isRunning}>
            Pause
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Music Player</h2>
        <audio ref={audioRef} src={TRACKS[currentTrack].src} />
        <div className="space-y-2">
          {TRACKS.map((track, index) => (
            <Button
              key={index}
              onClick={() => handleTrackChange(index)}
              variant={currentTrack === index ? "default" : "outline"}
            >
              {track.name}
            </Button>
          ))}
        </div>
        <div className="space-x-4">
          <Button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</Button>
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-[200px]"
          />
        </div>
      </div>
    </div>
  )
}
