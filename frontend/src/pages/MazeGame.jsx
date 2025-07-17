import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaPlay } from 'react-icons/fa';
import '../styles/MazeGame.css';

// Constants
const CELL_SIZE = 50;
const MAZE_WIDTH = 18;
const MAZE_HEIGHT = 10;

const MazeGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Canvas refs
  const canvasRef = useRef(null);
  const mazeCanvasRef = useRef(null); // Offscreen canvas for static maze
  const mazeGeneratedRef = useRef(false); // Track if maze has been generated
  
  // Game state
  const [gameState, setGameState] = useState('loading'); // loading, playing, challenge, victory, gameover, paused
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'maths');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('niveau') || '3e');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Game data
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [level] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Game objects
  // Calculate starting position based on cell size
  const startX = 1.5 * CELL_SIZE; // Column 1, centered
  const startY = 5 * CELL_SIZE; // Row 5, centered
  
  const [player, setPlayer] = useState({
    x: startX,
    y: startY,
    width: 30,
    height: 30,
    speed: 3,
    dx: 0,
    dy: 0,
    hasShield: false,
    isSprinting: false
  });
  
  const [maze, setMaze] = useState([]);
  const [knowledgeGates, setKnowledgeGates] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [answeredGates, setAnsweredGates] = useState([]);
  
  // Abilities
  const [abilities, setAbilities] = useState({
    sprint: { cooldown: 0, duration: 0, cost: 10 },
    hint: { cooldown: 0, uses: 3, cost: 0 },
    shield: { cooldown: 0, duration: 0, cost: 20 },
    freeze: { cooldown: 0, duration: 0, cost: 30 }
  });
  
  // Subject options
  const subjectOptions = [
    { value: 'maths', label: 'Mathématiques' },
    { value: 'sciences', label: 'Sciences' },
    { value: 'francais', label: 'Français' },
    { value: 'histoire', label: 'Histoire-Géo' },
    { value: 'anglais', label: 'Anglais' }
  ];
  
  const levelOptions = [
    { value: '3e', label: '3e' },
    { value: '2nde', label: '2nde' },
    { value: '1ere', label: '1ère' },
    { value: 'term', label: 'Terminale' }
  ];

  // Generate maze
  const generateMaze = useCallback(() => {
    const newMaze = [];
    
    // Create a simple maze layout
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      newMaze[y] = [];
      for (let x = 0; x < MAZE_WIDTH; x++) {
        // Create outer walls
        if (x === 0 || x === MAZE_WIDTH - 1 || y === 0 || y === MAZE_HEIGHT - 1) {
          newMaze[y][x] = 1; // Wall
        } else {
          newMaze[y][x] = 0; // Path by default
        }
      }
    }
    
    // Add some internal walls to create a maze-like structure
    // Horizontal walls
    for (let x = 2; x < MAZE_WIDTH - 2; x++) {
      if (x !== 8 && x !== 9) { // Leave gaps
        newMaze[2][x] = 1;
        newMaze[7][x] = 1;
      }
    }
    
    // Vertical walls
    for (let y = 2; y < MAZE_HEIGHT - 2; y++) {
      if (y !== 4 && y !== 5) { // Leave gaps
        newMaze[y][4] = 1;
        newMaze[y][13] = 1;
      }
    }
    
    // Add some random walls
    for (let i = 0; i < 15; i++) {
      let x = Math.floor(Math.random() * (MAZE_WIDTH - 4)) + 2;
      let y = Math.floor(Math.random() * (MAZE_HEIGHT - 4)) + 2;
      if (!(x === 1 && y === 5)) { // Don't block start
        newMaze[y][x] = 1;
      }
    }
    
    // Ensure start and end are clear
    newMaze[5][1] = 0; // Start
    newMaze[5][2] = 0; // Clear path from start
    newMaze[5][MAZE_WIDTH - 2] = 2; // Exit
    newMaze[5][MAZE_WIDTH - 3] = 0; // Clear path to exit
    
    setMaze(newMaze);
    
    // Generate knowledge gates
    const gates = [];
    const gateCount = 3 + level;
    for (let i = 0; i < gateCount && i < questions.length; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * (MAZE_WIDTH - 4)) + 2;
        y = Math.floor(Math.random() * (MAZE_HEIGHT - 4)) + 2;
        attempts++;
      } while ((newMaze[y][x] !== 0 || (x === 1 && y === 5)) && attempts < 100);
      
      if (newMaze[y][x] === 0) {
        gates.push({
          x: x * CELL_SIZE + CELL_SIZE / 2,
          y: y * CELL_SIZE + CELL_SIZE / 2,
          active: true,
          question: questions[i]
        });
      }
    }
    setKnowledgeGates(gates);
    
    // Generate collectibles
    const items = [];
    for (let i = 0; i < 5; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * (MAZE_WIDTH - 4)) + 2;
        y = Math.floor(Math.random() * (MAZE_HEIGHT - 4)) + 2;
        attempts++;
      } while (newMaze[y][x] !== 0 && attempts < 100);
      
      if (newMaze[y][x] === 0) {
        items.push({
          x: x * CELL_SIZE + CELL_SIZE / 2,
          y: y * CELL_SIZE + CELL_SIZE / 2,
          type: 'energy',
          value: 20,
          collected: false
        });
      }
    }
    setCollectibles(items);
  }, [level, questions]);

  // Load questions from backend
  const loadQuestions = async () => {
    try {
      setLoading(true);
      // Get the maze game ID from URL params
      const gameId = window.location.pathname.split('/').pop();
      
      const response = await axios.get(`http://localhost:5000/api/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          subject: selectedSubject,
          niveau: selectedLevel,
          count: 6
        }
      });
      
      if (response.data.game && response.data.game.questions) {
        setQuestions(response.data.game.questions);
      } else {
        // Fallback questions if API fails
        setQuestions([
          {
            question: "Combien font 2 + 2 ?",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
            explanation: "2 + 2 = 4"
          }
        ]);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Erreur lors du chargement des questions');
    } finally {
      setLoading(false);
    }
  };

  // Initialize game when component mounts
  useEffect(() => {
    const initializeGame = async () => {
      mazeGeneratedRef.current = false; // Reset maze generation flag
      await loadQuestions();
      setGameState('playing');
      setStartTime(Date.now());
      setScore(0);
      setEnergy(100);
      setCorrectAnswers(0);
      setTotalAnswers(0);
      setAnsweredGates([]);
      setXpEarned(0);
      setPlayer(prev => ({
        ...prev,
        x: startX,
        y: startY,
        dx: 0,
        dy: 0,
        hasShield: false,
        isSprinting: false
      }));
      setAbilities({
        sprint: { cooldown: 0, duration: 0, cost: 10 },
        hint: { cooldown: 0, uses: 3, cost: 0 },
        shield: { cooldown: 0, duration: 0, cost: 20 },
        freeze: { cooldown: 0, duration: 0, cost: 30 }
      });
    };
    
    initializeGame();
  }, [startX, startY]);
  
  // Save game results to backend
  const saveGameResults = async () => {
    try {
      const gameTime = startTime ? Date.now() - startTime : 0;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
      
      const gameData = {
        score: score,
        timeSpent: Math.floor(gameTime / 1000), // Convert to seconds
        accuracy: accuracy,
        correctAnswers: correctAnswers,
        totalAnswers: totalAnswers,
        xpEarned: xpEarned
      };
      
      console.log('Saving maze game results:', gameData);
      
      // Get the maze game ID from URL params
      const gameId = window.location.pathname.split('/').pop();
      
      const response = await axios.post(
        `http://localhost:5000/api/games/${gameId}/results`,
        gameData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        console.log('Game results saved successfully:', response.data.results);
      }
    } catch (error) {
      console.error('Error saving game results:', error);
      // Don't block the game if saving fails
    }
  };

  // Draw maze to offscreen canvas (only once when maze changes)
  const renderMazeToOffscreen = useCallback(() => {
    if (!mazeCanvasRef.current) {
      mazeCanvasRef.current = document.createElement('canvas');
      mazeCanvasRef.current.width = MAZE_WIDTH * CELL_SIZE;
      mazeCanvasRef.current.height = MAZE_HEIGHT * CELL_SIZE;
    }
    
    const ctx = mazeCanvasRef.current.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, mazeCanvasRef.current.width, mazeCanvasRef.current.height);
    
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cellX = x * CELL_SIZE;
        const cellY = y * CELL_SIZE;
        
        if (maze[y] && maze[y][x] === 1) {
          // Wall
          ctx.fillStyle = '#16213e';
          ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#0f3460';
          ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
        } else if (maze[y] && maze[y][x] === 2) {
          // Exit
          ctx.fillStyle = '#4caf50';
          ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = '#fff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏁', cellX + CELL_SIZE/2, cellY + CELL_SIZE/2);
        }
      }
    }
  }, [maze]);
  
  // Draw functions
  const drawMaze = useCallback((ctx) => {
    if (mazeCanvasRef.current) {
      ctx.drawImage(mazeCanvasRef.current, 0, 0);
    }
  }, []);

  const drawPlayer = useCallback((ctx) => {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Shield effect
    if (player.hasShield) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, player.width, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Player body
    ctx.fillStyle = '#e94560';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    
    // Player face
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎓', 0, 0);
    
    ctx.restore();
  }, [player]);

  const drawKnowledgeGates = useCallback((ctx) => {
    knowledgeGates.forEach(gate => {
      if (!gate.active) return;
      
      ctx.save();
      ctx.translate(gate.x, gate.y);
      
      // Gate glow effect
      const time = Date.now() / 1000;
      const glowSize = 20 + Math.sin(time * 2) * 5;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
      gradient.addColorStop(0, 'rgba(233, 69, 96, 0.5)');
      gradient.addColorStop(1, 'rgba(233, 69, 96, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Gate body
      ctx.fillStyle = '#e94560';
      ctx.fillRect(-20, -20, 40, 40);
      
      // Gate icon
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
      
      ctx.restore();
    });
  }, [knowledgeGates]);

  const drawCollectibles = useCallback((ctx) => {
    collectibles.forEach(item => {
      if (item.collected) return;
      
      ctx.save();
      ctx.translate(item.x, item.y);
      
      // Rotation animation
      const time = Date.now() / 1000;
      ctx.rotate(time);
      
      // Item glow
      ctx.fillStyle = 'rgba(255, 217, 61, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Item icon
      ctx.fillStyle = '#FFD93D';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);
      
      ctx.restore();
    });
  }, [collectibles]);

  
  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    const isCorrect = currentQuestion.options[answerIndex] === currentQuestion.correctAnswer;
    
    setTotalAnswers(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 100);
      setEnergy(prev => Math.min(100, prev + 10));
      
      // Award XP for correct answer (5 XP per correct answer like quiz battle)
      setXpEarned(prev => prev + 5);
      
      // Deactivate the gate and mark as answered
      setKnowledgeGates(prev => prev.map((gate, index) => 
        index === currentQuestion.gateIndex ? { ...gate, active: false } : gate
      ));
      setAnsweredGates(prev => [...prev, currentQuestion.gateIndex]);
      
      setTimeout(() => {
        setGameState('playing');
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setShowHint(false);
        // Clear all key states when returning to playing
        keysRef.current = {};
        setPlayer(prev => ({ ...prev, dx: 0, dy: 0 }));
      }, 1500);
    } else {
      if (!player.hasShield) {
        setEnergy(prev => {
          const newEnergy = Math.max(0, prev - 20);
          if (newEnergy === 0) {
            // Save results before game over
            saveGameResults();
            setGameState('gameover');
          }
          return newEnergy;
        });
      }
      
      setTimeout(() => {
        if (gameState !== 'gameover') {
          setGameState('playing');
          setCurrentQuestion(null);
          setSelectedAnswer(null);
          setShowHint(false);
          // Clear all key states when returning to playing
          keysRef.current = {};
          setPlayer(prev => ({ ...prev, dx: 0, dy: 0 }));
        }
      }, 2500);
    }
  };
  
  // Use hint ability
  const activateHint = () => {
    if (abilities.hint.uses > 0 && gameState === 'challenge') {
      setShowHint(true);
      setAbilities(prev => ({
        ...prev,
        hint: { ...prev.hint, uses: prev.hint.uses - 1 }
      }));
    }
  };
  
  // Pause/resume game
  const [isPaused, setIsPaused] = useState(false);
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setIsPaused(prev => {
        const newPaused = !prev;
        if (newPaused) {
          // Clear key states when pausing
          keysRef.current = {};
          setPlayer(prev => ({ ...prev, dx: 0, dy: 0 }));
        }
        isRunningRef.current = !newPaused;
        return newPaused;
      });
    }
  }, [gameState, isPaused]);
  
  // Activate ability
  const activateAbility = (abilityName) => {
    if (gameState !== 'playing' && gameState !== 'challenge') return;
    
    const ability = abilities[abilityName];
    
    switch(abilityName) {
      case 'sprint':
        if (ability.cooldown <= 0 && energy >= ability.cost) {
          setPlayer(prev => ({ ...prev, isSprinting: true }));
          setAbilities(prev => ({
            ...prev,
            sprint: { ...prev.sprint, duration: 5000, cooldown: 10000 }
          }));
          setEnergy(prev => prev - ability.cost);
        }
        break;
        
      case 'hint':
        activateHint();
        break;
        
      case 'shield':
        if (ability.cooldown <= 0 && energy >= ability.cost) {
          setPlayer(prev => ({ ...prev, hasShield: true }));
          setAbilities(prev => ({
            ...prev,
            shield: { ...prev.shield, duration: 10000, cooldown: 20000 }
          }));
          setEnergy(prev => prev - ability.cost);
        }
        break;
        
      case 'freeze':
        if (ability.cooldown <= 0 && energy >= ability.cost && gameState === 'challenge') {
          // Freeze timer implemented as pausing question timer
          setAbilities(prev => ({
            ...prev,
            freeze: { ...prev.freeze, cooldown: 30000, duration: 5000 }
          }));
          setEnergy(prev => prev - ability.cost);
        }
        break;
      default:
        break;
    }
  };
  
  
  // Update player movement based on current keys
  const updateMovement = useCallback(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    let dx = 0;
    let dy = 0;
    
    if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) dx = -1;
    if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) dx = 1;
    if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) dy = -1;
    if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) dy = 1;
    
    setPlayer(prev => ({ ...prev, dx, dy }));
  }, [gameState, isPaused]);
  
  // Update player position with collision detection
  const updatePlayer = useCallback(() => {
    if (player.dx === 0 && player.dy === 0) return;
    
    const speed = player.isSprinting ? player.speed * 1.5 : player.speed;
    const nextX = player.x + player.dx * speed;
    const nextY = player.y + player.dy * speed;
    
    // Get player boundaries for next position
    const playerLeft = nextX - player.width / 2;
    const playerRight = nextX + player.width / 2;
    const playerTop = nextY - player.height / 2;
    const playerBottom = nextY + player.height / 2;
    
    // Check if the new position would be valid
    let canMove = true;
    
    // Check all four corners and center of the player
    const corners = [
      { x: playerLeft, y: playerTop },
      { x: playerRight, y: playerTop },
      { x: playerLeft, y: playerBottom },
      { x: playerRight, y: playerBottom },
      { x: nextX, y: nextY } // Center point
    ];
    
    for (let corner of corners) {
      const cellX = Math.floor(corner.x / CELL_SIZE);
      const cellY = Math.floor(corner.y / CELL_SIZE);
      
      // Check bounds
      if (cellX < 0 || cellX >= MAZE_WIDTH || cellY < 0 || cellY >= MAZE_HEIGHT) {
        canMove = false;
        break;
      }
      
      // Check if it's a wall
      if (maze[cellY] && maze[cellY][cellX] === 1) {
        canMove = false;
        break;
      }
    }
    
    let newX = player.x;
    let newY = player.y;
    
    // Update position if movement is valid
    if (canMove) {
      newX = nextX;
      newY = nextY;
    } else {
      // Try to move in only one direction if diagonal movement is blocked
      if (player.dx !== 0 && player.dy !== 0) {
        // Try horizontal movement only
        const horizontalX = player.x + player.dx * speed;
        let canMoveHorizontal = true;
        
        const hCorners = [
          { x: horizontalX - player.width / 2, y: player.y - player.height / 2 },
          { x: horizontalX + player.width / 2, y: player.y - player.height / 2 },
          { x: horizontalX - player.width / 2, y: player.y + player.height / 2 },
          { x: horizontalX + player.width / 2, y: player.y + player.height / 2 }
        ];
        
        for (let corner of hCorners) {
          const cellX = Math.floor(corner.x / CELL_SIZE);
          const cellY = Math.floor(corner.y / CELL_SIZE);
          if (cellX < 0 || cellX >= MAZE_WIDTH || cellY < 0 || cellY >= MAZE_HEIGHT || (maze[cellY] && maze[cellY][cellX] === 1)) {
            canMoveHorizontal = false;
            break;
          }
        }
        
        if (canMoveHorizontal) {
          newX = horizontalX;
        } else {
          // Try vertical movement only
          const verticalY = player.y + player.dy * speed;
          let canMoveVertical = true;
          
          const vCorners = [
            { x: player.x - player.width / 2, y: verticalY - player.height / 2 },
            { x: player.x + player.width / 2, y: verticalY - player.height / 2 },
            { x: player.x - player.width / 2, y: verticalY + player.height / 2 },
            { x: player.x + player.width / 2, y: verticalY + player.height / 2 }
          ];
          
          for (let corner of vCorners) {
            const cellX = Math.floor(corner.x / CELL_SIZE);
            const cellY = Math.floor(corner.y / CELL_SIZE);
            if (cellX < 0 || cellX >= MAZE_WIDTH || cellY < 0 || cellY >= MAZE_HEIGHT || (maze[cellY] && maze[cellY][cellX] === 1)) {
              canMoveVertical = false;
              break;
            }
          }
          
          if (canMoveVertical) {
            newY = verticalY;
          }
        }
      }
    }
    
    // Update player position if it changed
    if (newX !== player.x || newY !== player.y) {
      setPlayer(prev => ({ ...prev, x: newX, y: newY }));
      
      // Check for interactions after moving
      checkInteractions(newX, newY);
    }
  }, [player, maze, MAZE_WIDTH, MAZE_HEIGHT, CELL_SIZE]);
  
  // Check interactions with gates and collectibles
  const checkInteractions = useCallback((playerX, playerY) => {
    // Check knowledge gates
    knowledgeGates.forEach((gate, index) => {
      if (gate.active && Math.abs(playerX - gate.x) < 30 && Math.abs(playerY - gate.y) < 30) {
        setCurrentQuestion({...gate.question, gateIndex: index});
        setSelectedAnswer(null);
        setShowHint(false);
        setGameState('challenge');
        setPlayer(prev => ({ ...prev, dx: 0, dy: 0 }));
        // Clear all key states when entering challenge
        keysRef.current = {};
      }
    });
    
    // Check collectibles
    setCollectibles(prev => prev.map(item => {
      if (!item.collected && Math.abs(playerX - item.x) < 25 && Math.abs(playerY - item.y) < 25) {
        setEnergy(prev => Math.min(100, prev + item.value));
        setScore(prev => prev + 50);
        // Award small XP bonus for collecting items
        setXpEarned(prev => prev + 1);
        return { ...item, collected: true };
      }
      return item;
    }));
    
    // Check exit
    const exitX = (MAZE_WIDTH - 2) * CELL_SIZE + CELL_SIZE / 2;
    const exitY = 5 * CELL_SIZE + CELL_SIZE / 2;
    if (Math.abs(playerX - exitX) < 30 && Math.abs(playerY - exitY) < 30) {
      // Check if all knowledge gates have been answered (not just deactivated)
      if (answeredGates.length >= knowledgeGates.length && knowledgeGates.length > 0) {
        saveGameResults();
        setGameState('victory');
      }
    }
  }, [knowledgeGates, MAZE_WIDTH, CELL_SIZE]);
  
  // Main game loop
  const gameLoopRef = useRef();
  const isRunningRef = useRef(false);
  
  const gameLoop = useCallback((currentTime) => {
    if (gameState === 'playing' && !isPaused) {
      updateMovement();
      updatePlayer();
      
      // Draw everything
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawMaze(ctx);
        drawCollectibles(ctx);
        drawKnowledgeGates(ctx);
        drawPlayer(ctx);
      }
    }
    
    if (isRunningRef.current && !isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, isPaused, updateMovement, updatePlayer, drawMaze, drawCollectibles, drawKnowledgeGates, drawPlayer]);

  // Update ability timers
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    const interval = setInterval(() => {
      setAbilities(prev => {
        const newAbilities = { ...prev };
        
        Object.keys(newAbilities).forEach(name => {
          if (newAbilities[name].cooldown > 0) {
            newAbilities[name].cooldown = Math.max(0, newAbilities[name].cooldown - 100);
          }
          if (newAbilities[name].duration > 0) {
            newAbilities[name].duration = Math.max(0, newAbilities[name].duration - 100);
            if (newAbilities[name].duration === 0) {
              if (name === 'sprint') {
                setPlayer(prev => ({ ...prev, isSprinting: false }));
              } else if (name === 'shield') {
                setPlayer(prev => ({ ...prev, hasShield: false }));
              }
            }
          }
        });
        
        return newAbilities;
      });
      
      // Sprint energy consumption
      if (player.isSprinting && energy > 0) {
        setEnergy(prev => {
          const newEnergy = Math.max(0, prev - 0.5);
          if (newEnergy === 0) {
            setPlayer(prev => ({ ...prev, isSprinting: false }));
          }
          return newEnergy;
        });
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [gameState, player.isSprinting, energy]);
  
  // Setup game loop with requestAnimationFrame
  useEffect(() => {
    if (gameState === 'playing') {
      // Cancel any existing loop before starting new one
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      isRunningRef.current = true;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      isRunningRef.current = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }
    
    return () => {
      isRunningRef.current = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, gameLoop]);

  // Generate maze when questions are loaded (only once per game session)
  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && !mazeGeneratedRef.current) {
      generateMaze();
      mazeGeneratedRef.current = true;
    }
  }, [questions, gameState, generateMaze]);
  
  // Render maze to offscreen canvas when maze changes
  useEffect(() => {
    if (maze.length > 0) {
      renderMazeToOffscreen();
    }
  }, [maze, renderMazeToOffscreen]);

  // Keyboard state
  const keysRef = useRef({});
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle pause
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') {
        togglePause();
        return;
      }
      
      if (gameState !== 'playing' || isPaused) return;
      keysRef.current[e.key] = true;
      
      // Prevent default browser behavior for arrow keys and WASD
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (gameState !== 'playing' || isPaused) return;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isPaused, togglePause]);
  
  // Clear movement when game state changes
  useEffect(() => {
    if (gameState !== 'playing') {
      keysRef.current = {};
      setPlayer(prev => ({ ...prev, dx: 0, dy: 0 }));
    }
  }, [gameState]);
  

  const formatTime = (time) => {
    const elapsed = Math.floor((time - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="maze-game-page">
        <div className="maze-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Génération du labyrinthe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maze-game-page">
        <div className="maze-container">
          <div className="error-state">
            <h2>Erreur</h2>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => setError(null)}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="maze-game-page">
      <div className="maze-container">
        <button className="back-button" onClick={() => navigate('/mini-jeux')}>
          <FaArrowLeft /> Retour aux mini-jeux
        </button>


        {gameState === 'playing' && (
          <div className="game-container">
            {isPaused && (
              <div className="pause-overlay">
                <div className="pause-content">
                  <h2>Jeu en Pause</h2>
                  <p>Appuyez sur P ou ESC pour reprendre</p>
                  <button onClick={togglePause} className="menu-button">Reprendre</button>
                </div>
              </div>
            )}
            <div className="game-header">
              <div className="header-item">
                <span className="icon">🎯</span>
                <span>Score: {score}</span>
              </div>
              <div className="header-item">
                <span className="icon">⚡</span>
                <span>Énergie: {Math.floor(energy)}</span>
              </div>
              <div className="header-item">
                <span className="icon">🎆</span>
                <span>XP: +{xpEarned}</span>
              </div>
              <div className="header-item">
                <span className="icon">⏱️</span>
                <span>Temps: {startTime ? formatTime(Date.now()) : '0:00'}</span>
              </div>
              <div className="header-item">
                <button onClick={togglePause} className="pause-button">
                  {isPaused ? '▶️ Reprendre' : '⏸️ Pause'}
                </button>
              </div>
            </div>

            <canvas 
              ref={canvasRef}
              width={900}
              height={500}
              className="game-canvas"
            />

            <div className="game-ui">
              <div className="current-subject">
                {subjectOptions.find(s => s.value === selectedSubject)?.label} - {selectedLevel}
              </div>
              
              <div className="abilities">
                <div 
                  className={`ability ${abilities.sprint.duration > 0 ? 'active' : ''} ${abilities.sprint.cooldown > 0 ? 'cooldown' : ''}`}
                  onClick={() => activateAbility('sprint')}
                >
                  <div className="ability-icon">🏃</div>
                  <div>Sprint (1)</div>
                  <div className="ability-desc">+50% vitesse</div>
                </div>
                <div 
                  className={`ability ${abilities.hint.uses === 0 ? 'cooldown' : ''}`}
                  onClick={() => activateAbility('hint')}
                >
                  <div className="ability-icon">💡</div>
                  <div>Indice ({abilities.hint.uses})</div>
                  <div className="ability-desc">Révèle indices</div>
                </div>
                <div 
                  className={`ability ${abilities.shield.duration > 0 ? 'active' : ''} ${abilities.shield.cooldown > 0 ? 'cooldown' : ''}`}
                  onClick={() => activateAbility('shield')}
                >
                  <div className="ability-icon">🛡️</div>
                  <div>Bouclier (3)</div>
                  <div className="ability-desc">Protection</div>
                </div>
                <div 
                  className={`ability ${abilities.freeze.cooldown > 0 ? 'cooldown' : ''}`}
                  onClick={() => activateAbility('freeze')}
                >
                  <div className="ability-icon">❄️</div>
                  <div>Gel (4)</div>
                  <div className="ability-desc">Arrête le temps</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameState === 'challenge' && currentQuestion && (
          <div className="challenge-panel show">
            <h3>Défi Éducatif</h3>
            <p className="challenge-question">{currentQuestion.question}</p>
            <div className="challenge-options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`challenge-option ${
                    selectedAnswer === index
                      ? option === currentQuestion.correctAnswer
                        ? 'correct'
                        : 'incorrect'
                      : ''
                  } ${
                    selectedAnswer !== null && option === currentQuestion.correctAnswer
                      ? 'correct'
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </button>
              ))}
            </div>
            {showHint && (
              <div className="challenge-hint">
                💡 {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
        
        {gameState === 'victory' && (
          <div className="victory-screen show">
            <h2>🎉 Victoire! 🎉</h2>
            <p>Vous avez terminé le labyrinthe!</p>
            <div className="victory-stats">
              <p>Score Final: <span className="stat-value">{score}</span></p>
              <p>XP Gagné: <span className="stat-value">+{xpEarned} XP</span></p>
              <p>Temps: <span className="stat-value">{startTime ? formatTime(Date.now()) : '0:00'}</span></p>
              <p>Précision: <span className="stat-value">{totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100}%</span></p>
            </div>
            <button className="menu-button" onClick={() => {
              mazeGeneratedRef.current = false;
              window.location.reload();
            }}>Rejouer</button>
            <button className="menu-button" onClick={() => navigate('/mini-jeux')}>Changer de jeu</button>
          </div>
        )}
        
        {gameState === 'gameover' && (
          <div className="gameover-screen show">
            <h2>💀 Game Over! 💀</h2>
            <p>Votre énergie est épuisée!</p>
            <div className="gameover-stats">
              <p>Score: <span className="stat-value">{score}</span></p>
              <p>XP Gagné: <span className="stat-value">+{xpEarned} XP</span></p>
              <p>Questions répondues: <span className="stat-value">{correctAnswers}/{totalAnswers}</span></p>
            </div>
            <button className="menu-button" onClick={() => {
              mazeGeneratedRef.current = false;
              window.location.reload();
            }}>Rejouer</button>
            <button className="menu-button" onClick={() => navigate('/mini-jeux')}>Retour aux mini-jeux</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MazeGame;