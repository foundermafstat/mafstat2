"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useData } from "@/hooks/use-data"
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react"

interface Track {
  name: string
  filename: string
  src: string
}

export function GameTimer() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const audioRef = useRef<HTMLAudioElement>(null)
  const shouldPlayRef = useRef(false) // Ref для отслеживания, нужно ли воспроизводить после загрузки
  const { data, isLoading } = useData<{ tracks: Track[] }>("/api/music")
  const tracks = data?.tracks || []

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

  // Загружаем трек при изменении currentTrack
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current && currentTrack < tracks.length) {
      const audio = audioRef.current
      const trackIndex = currentTrack
      
      // Останавливаем текущее воспроизведение перед загрузкой нового трека
      audio.pause()
      audio.currentTime = 0
      
      // Обработчик готовности к воспроизведению
      const handleCanPlay = () => {
        if (audioRef.current && trackIndex === currentTrack && shouldPlayRef.current) {
          // Воспроизводим только если трек все еще актуален и должен играть
          audioRef.current.play().catch((error) => {
            console.error('Ошибка воспроизведения:', error)
            setIsPlaying(false)
            shouldPlayRef.current = false
          })
        }
      }
      
      const handleError = () => {
        console.error('Ошибка загрузки трека')
        setIsPlaying(false)
        shouldPlayRef.current = false
      }
      
      // Добавляем обработчики перед загрузкой
      audio.addEventListener('canplay', handleCanPlay, { once: true })
      audio.addEventListener('loadeddata', handleCanPlay, { once: true })
      audio.addEventListener('error', handleError, { once: true })
      
      // Устанавливаем новый источник
      audio.src = tracks[currentTrack].src
      audio.load() // Явно загружаем новый трек
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('loadeddata', handleCanPlay)
        audio.removeEventListener('error', handleError)
      }
    }
  }, [currentTrack, tracks.length])
  
  // Обновляем ref при изменении isPlaying
  useEffect(() => {
    shouldPlayRef.current = isPlaying
  }, [isPlaying])

  // Обработка окончания трека - переход к следующему
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (currentTrack < tracks.length - 1) {
        // Переход к следующему треку с сохранением состояния воспроизведения
        shouldPlayRef.current = isPlaying
        setCurrentTrack(currentTrack + 1)
      } else {
        setIsPlaying(false)
        shouldPlayRef.current = false
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack, tracks.length, isPlaying])

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
        setIsPlaying(false)
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error)
          setIsPlaying(false)
        })
        setIsPlaying(true)
      }
    }
  }

  const handleTrackChange = (index: number) => {
    if (index < 0 || index >= tracks.length) return
    
    const audio = audioRef.current
    if (audio) {
      // Останавливаем текущее воспроизведение
      audio.pause()
      audio.currentTime = 0
      
      // Сохраняем состояние воспроизведения перед изменением трека
      const wasPlaying = isPlaying
      shouldPlayRef.current = wasPlaying
      
      // Обновляем индекс трека - это вызовет useEffect, который загрузит новый трек
      setCurrentTrack(index)
      
      // Если был включен плеер, включаем его после загрузки нового трека
      if (wasPlaying) {
        setIsPlaying(true)
      }
    } else {
      setCurrentTrack(index)
      setIsPlaying(true)
      shouldPlayRef.current = true
    }
  }

  const handleNextTrack = () => {
    if (currentTrack < tracks.length - 1) {
      handleTrackChange(currentTrack + 1)
    } else {
      handleTrackChange(0) // Переход к первому треку
    }
  }

  const handlePrevTrack = () => {
    if (currentTrack > 0) {
      handleTrackChange(currentTrack - 1)
    } else {
      handleTrackChange(tracks.length - 1) // Переход к последнему треку
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Music Player</h2>
          {tracks.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Всего треков: {tracks.length}
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Загрузка списка треков...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Музыкальные файлы не найдены
          </div>
        ) : (
          <>
            <audio ref={audioRef} />
            
            {/* Текущий трек */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Сейчас играет:</div>
              <div className="text-lg font-semibold">
                {tracks[currentTrack]?.name || 'Не выбран'}
              </div>
            </div>

            {/* Список треков */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tracks.map((track, index) => (
                <Button
                  key={index}
                  onClick={() => handleTrackChange(index)}
                  variant={currentTrack === index ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{index + 1}.</span>
                  {track.name}
                </Button>
              ))}
            </div>

            {/* Управление плеером */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevTrack}
                  disabled={tracks.length === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  disabled={tracks.length === 0}
                  className="w-20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextTrack}
                  disabled={tracks.length === 0}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Громкость */}
              <div className="flex items-center space-x-4">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {volume}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
