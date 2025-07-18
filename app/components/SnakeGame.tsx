"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./DemoComponents";

const BOARD_SIZE = 15;
const INITIAL_SNAKE = [
  { x: 7, y: 7 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 150; // ms per move

function getRandomFood(snake: { x: number; y: number }[]) {
  let newFood: { x: number; y: number };
  do {
    newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (snake.some((s) => s.x === newFood.x && s.y === newFood.y));
  return newFood;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(() => getRandomFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const moveRef = useRef(direction);
  const gameOverRef = useRef(gameOver);
  const foodRef = useRef(food);
  const isPlayingRef = useRef(isPlaying);

  // Keep refs in sync
  useEffect(() => {
    moveRef.current = direction;
    gameOverRef.current = gameOver;
    foodRef.current = food;
    isPlayingRef.current = isPlaying;
  }, [direction, gameOver, food, isPlaying]);

  // Handle keyboard input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (gameOverRef.current) return;
      
      // Start the game on first key press
      if (!isPlayingRef.current) {
        setIsPlaying(true);
      }
      
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (moveRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (moveRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (moveRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (moveRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || !isPlaying) return;
    
    const interval = setInterval(() => {
      setSnake((prev) => {
        const newHead = {
          x: (prev[0].x + direction.x + BOARD_SIZE) % BOARD_SIZE,
          y: (prev[0].y + direction.y + BOARD_SIZE) % BOARD_SIZE,
        };
        
        // Check collision with self
        if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }
        
        let newSnake;
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          newSnake = [newHead, ...prev];
          const newFood = getRandomFood(newSnake);
          setFood(newFood);
          setScore((s) => s + 1);
        } else {
          newSnake = [newHead, ...prev.slice(0, -1)];
        }
        return newSnake;
      });
    }, SPEED);
    
    return () => clearInterval(interval);
  }, [direction, gameOver, isPlaying]);

  const handleRestart = useCallback(() => {
    const newSnake = INITIAL_SNAKE;
    const newFood = getRandomFood(newSnake);
    setSnake(newSnake);
    setDirection(INITIAL_DIRECTION);
    setFood(newFood);
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
  }, []);

  // Touch controls for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    
    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    }
    
    function handleTouchEnd(e: TouchEvent) {
      if (gameOverRef.current) return;
      
      // Start the game on first touch
      if (!isPlayingRef.current) {
        setIsPlaying(true);
      }
      
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (dx > 20 && moveRef.current.x !== -1) setDirection({ x: 1, y: 0 });
        else if (dx < -20 && moveRef.current.x !== 1) setDirection({ x: -1, y: 0 });
      } else {
        // Vertical
        if (dy > 20 && moveRef.current.y !== -1) setDirection({ x: 0, y: 1 });
        else if (dy < -20 && moveRef.current.y !== 1) setDirection({ x: 0, y: -1 });
      }
    }
    
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full p-4">
      <div className="mb-4 flex justify-between w-full max-w-xs">
        <span className="font-bold text-[var(--app-accent)]">Score: {score}</span>
        {gameOver && <span className="text-red-500 font-bold">Game Over!</span>}
        {!isPlaying && !gameOver && <span className="text-[var(--app-foreground-muted)]">Press any key to start</span>}
      </div>
      
      <div
        className="grid bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg p-2"
        style={{
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1.5rem)`,
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1.5rem)`,
          touchAction: "none",
        }}
      >
        {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => {
          const x = i % BOARD_SIZE;
          const y = Math.floor(i / BOARD_SIZE);
          const isSnake = snake.some((s) => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;
          
          return (
            <div
              key={i}
              className={`w-6 h-6 flex items-center justify-center border border-[var(--app-card-border)]
                ${isHead ? "bg-[var(--app-accent)] text-white font-bold" : ""}
                ${isSnake && !isHead ? "bg-[var(--app-accent-light)]" : ""}
                ${isFood ? "bg-green-500" : ""}
                rounded-sm`}
            >
              {isHead ? "●" : isFood ? "🍎" : ""}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-col gap-2">
        {gameOver && (
          <Button variant="primary" onClick={handleRestart}>
            Play Again
          </Button>
        )}
        {!isPlaying && !gameOver && (
          <div className="text-center text-sm text-[var(--app-foreground-muted)]">
            <p>Use arrow keys or WASD to move</p>
            <p>On mobile, swipe to control</p>
          </div>
        )}
      </div>
    </div>
  );
} 