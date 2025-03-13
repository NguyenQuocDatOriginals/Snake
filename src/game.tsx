import React, { useEffect, useRef } from 'react';
import './App.scss';

const GRID_WIDTH = 20;               // Số cột của lưới
const GRID_HEIGHT = 20;              // Số hàng của lưới
const CELL_SIZE = 20;                // Kích thước mỗi ô (pixel)
const CANVAS_WIDTH = GRID_WIDTH * CELL_SIZE;  // 400px
const CANVAS_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 400px
const SNAKE_SPEED = 150;             // Tốc độ di chuyển của rắn (ms mỗi bước)

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let snake: Position[] = [{ x: 10, y: 10 }];  // Vị trí ban đầu của rắn (ở giữa lưới)
    let direction: Direction = 'right';          // Hướng di chuyển ban đầu
    let food: Position = generateFood();         // Vị trí thức ăn ngẫu nhiên
    let score = 0;                               // Điểm số
    let gameState: 'start' | 'play' | 'end' = 'start'; // Trạng thái trò chơi
    let lastTime = 0;
    let accumulatedTime = 0;

    // Hàm tạo vị trí thức ăn mới
    function generateFood(): Position {
      let x: number, y: number;
      do {
        x = Math.floor(Math.random() * GRID_WIDTH);
        y = Math.floor(Math.random() * GRID_HEIGHT);
      } while (snake.some(segment => segment.x === x && segment.y === y));
      return { x, y };
    }

    // Xử lý đầu vào từ bàn phím
    const handleInput = (event: KeyboardEvent) => {
      if (gameState === 'play') {
        switch (event.key) {
          case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
          case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
          case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
          case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
        }
      } else if (gameState === 'start' || gameState === 'end') {
        if (event.key === ' ') {
          resetGame();
          gameState = 'play';
        }
      }
    };

    // Cập nhật trạng thái trò chơi
    const update = (deltaTime: number) => {
      if (gameState === 'play') {
        accumulatedTime += deltaTime;
        if (accumulatedTime >= SNAKE_SPEED) {
          accumulatedTime -= SNAKE_SPEED;
          moveSnake();
          checkCollisions();
        }
      }
    };

    // Di chuyển rắn
    const moveSnake = () => {
      const head = { ...snake[0] };
      switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }
      snake.unshift(head);

      // Kiểm tra nếu rắn ăn được thức ăn
      if (head.x === food.x && head.y === food.y) {
        score++;
        food = generateFood();
      } else {
        snake.pop();
      }
    };

    // Kiểm tra va chạm của rắn (với tường hoặc chính mình)
    const checkCollisions = () => {
      const head = snake[0];
      if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        gameState = 'end';
        return;
      }
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          gameState = 'end';
          break;
        }
      }
    };

    // Vẽ giao diện trò chơi với giao diện được cải tiến
    const draw = () => {
      // Vẽ nền trắng cho canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Vẽ lưới nền với màu nhẹ
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
        ctx.stroke();
      }

      // Vẽ rắn với màu xanh lá
      ctx.fillStyle = 'green';
      snake.forEach(segment => {
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });

      // Vẽ thức ăn với màu đỏ
      ctx.fillStyle = 'red';
      ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      // Vẽ thông tin trò chơi với font chữ đẹp và căn giữa
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (gameState === 'start') {
        ctx.fillText('Nhấn phím cách để chơi', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (gameState === 'end') {
        ctx.fillText('Bạn đã thua cuộc!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.fillText(`Điểm: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText('Nhấn phím cách để chơi lại', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      } else {
        ctx.fillText(`Điểm: ${score}`, CANVAS_WIDTH / 2, 30);
      }
    };

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      update(deltaTime);
      draw();
      requestAnimationFrame(gameLoop);
    };

    // Đặt lại trò chơi về trạng thái ban đầu
    const resetGame = () => {
      snake = [{ x: 10, y: 10 }];
      direction = 'right';
      food = generateFood();
      score = 0;
    };

    document.addEventListener('keydown', handleInput);
    requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('keydown', handleInput);
    };
  }, []);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />;
};

export default Game;