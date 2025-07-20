        // Chess piece Unicode symbols - using black piece symbols for gold pieces for better visibility
        // Chess piece Unicode symbols - using filled symbols for better visibility
const pieces = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

// Enhanced styling for better visibility
const goldPieceStyle = 'color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-weight: bold;';
const redPieceStyle = 'color: #DC143C; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-weight: bold;';

// Initial board setup
let board = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

let currentPlayer = 'w';
let selectedSquare = null;
let gameHistory = [];
let moveHistory = [];
let gameOver = false;
let pendingPromotion = null;
let enPassantTarget = null;
let gameStarted = false;
let currentMoveIndex = -1;
// Castling rights
let castlingRights = {
    wK: true,  // White king-side
    wQ: true,  // White queen-side
    bK: true,  // Black king-side
    bQ: true   // Black queen-side
};

const FIFTY_MOVE_RULE_LIMIT = 100; // 50 moves = 100 half-moves
const PROMOTION_TIMEOUT = 15000; // 15 seconds for promotion choice
const THREEFOLD_REPETITION_LIMIT = 3;

// Draw detection variables
let positionHistory = [];
let halfMoveClock = 0; // For navigation through move history

let gameTimer = {
    white: 600000, // 10 minutes in milliseconds
    black: 600000,
    currentStart: null,
    interval: null
};

const moveCache = new Map();

function clearMoveCache() {
    moveCache.clear();
}

// Audio context for sound alerts
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playCheckSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playCastleSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Special castle sound - ascending notes
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(450, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
}

function playPromotionSound() {
    // Triumphant promotion sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523, audioContext.currentTime); // C5
    oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
    oscillator1.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
    
    oscillator2.frequency.setValueAtTime(261, audioContext.currentTime); // C4
    oscillator2.frequency.setValueAtTime(329, audioContext.currentTime + 0.1); // E4
    oscillator2.frequency.setValueAtTime(392, audioContext.currentTime + 0.2); // G4
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.5);
    oscillator2.stop(audioContext.currentTime + 0.5);
}

function playTimeWarningSound() {
    // Play when < 1 minute remaining
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playCheckmateSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
    oscillator1.frequency.setValueAtTime(784, audioContext.currentTime + 0.4);
    
    oscillator2.frequency.setValueAtTime(261, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(329, audioContext.currentTime + 0.2);
    oscillator2.frequency.setValueAtTime(392, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.8);
    oscillator2.stop(audioContext.currentTime + 0.8);
}
function playDrawSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(450, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
}

function playMoveSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playIllegalMoveSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playCaptureSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

function isValidCastlingMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const color = piece[0];
    
    // Must be king moving 2 squares horizontally on same rank
    if (piece[1] !== 'K' || fromRow !== toRow || Math.abs(fromCol - toCol) !== 2) {
        return false;
    }
    
    // King must be on starting square
    const expectedKingRow = color === 'w' ? 7 : 0;
    const expectedKingCol = 4;
    if (fromRow !== expectedKingRow || fromCol !== expectedKingCol) {
        return false;
    }
    
    // King cannot be in check
    if (isInCheck(color)) return false;
    
    const isKingSide = toCol > fromCol;
    const castlingKey = color + (isKingSide ? 'K' : 'Q');
    
    // Check castling rights
    if (!castlingRights[castlingKey]) return false;
    
    const rookCol = isKingSide ? 7 : 0;
    const expectedRook = color + 'R';
    
    // Rook must be in correct position
    if (board[fromRow][rookCol] !== expectedRook) {
        return false;
    }
    
    // Check path is clear between king and rook
    const step = isKingSide ? 1 : -1;
    const startCol = Math.min(fromCol, rookCol) + 1;
    const endCol = Math.max(fromCol, rookCol) - 1;
    
    for (let col = startCol; col <= endCol; col++) {
        if (board[fromRow][col] !== null) {
            return false;
        }
    }
    
    // King cannot pass through or end up in check
    for (let col = fromCol; col !== toCol + step; col += step) {
        // Temporarily place king
        const originalPiece = board[fromRow][col];
        board[fromRow][col] = piece;
        if (col !== fromCol) {
            board[fromRow][fromCol] = null;
        }
        
        const inCheck = isInCheck(color);
        
        // Restore
        board[fromRow][fromCol] = piece;
        board[fromRow][col] = originalPiece;
        
        if (inCheck) return false;
    }
    
    return true;
}

function updateCastlingRights(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
    const color = piece[0];
    const pieceType = piece[1];
    
    // King moves - lose both castling rights
    if (pieceType === 'K') {
        castlingRights[color + 'K'] = false;
        castlingRights[color + 'Q'] = false;
    }
    
    // Rook moves - lose castling right for that side
    if (pieceType === 'R') {
        if (color === 'w' && fromRow === 7) {
            if (fromCol === 0) castlingRights.wQ = false;
            if (fromCol === 7) castlingRights.wK = false;
        } else if (color === 'b' && fromRow === 0) {
            if (fromCol === 0) castlingRights.bQ = false;
            if (fromCol === 7) castlingRights.bK = false;
        }
    }
    
    // Rook captured - lose castling right for that side
    if (capturedPiece && capturedPiece[1] === 'R') {
        if (toRow === 0) {
            if (toCol === 0) castlingRights.bQ = false;
            if (toCol === 7) castlingRights.bK = false;
        } else if (toRow === 7) {
            if (toCol === 0) castlingRights.wQ = false;
            if (toCol === 7) castlingRights.wK = false;
        }
    }
}

function areKingsAdjacent() {
    let whiteKing = null, blackKing = null;
    
    // Find both kings
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === 'wK') whiteKing = {r, c};
            if (board[r][c] === 'bK') blackKing = {r, c};
        }
    }
    
    if (!whiteKing || !blackKing) return false;
    
    const rowDiff = Math.abs(whiteKing.r - blackKing.r);
    const colDiff = Math.abs(whiteKing.c - blackKing.c);
    
    return rowDiff <= 1 && colDiff <= 1;
}

function checkForDraw() {
    // Check for stalemate
    if (!isInCheck(currentPlayer) && !hasLegalMoves(currentPlayer)) {
        return 'stalemate';
    }
    
    // Check for insufficient material
    if (hasInsufficientMaterial()) {
        return 'insufficient';
    }
    
    // Check for dead position
    if (isDeadPosition()) {
        return 'dead';
    }
    
    // Check for threefold repetition
    if (hasThreefoldRepetition()) {
        return 'repetition';
    }
    
    // Check for perpetual check
    if (isPerpetualCheck()) {
        return 'perpetual';
    }
    
    // Check for 50-move rule
    if (halfMoveClock >= FIFTY_MOVE_RULE_LIMIT) {
        return 'fifty';
    }
    
    return null;
}


function hasAnyLegalMove(color) {
    return hasLegalMoves(color); // Use existing function
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    // Basic boundary checks
    if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
        toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
        return false;
    }
    
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    // Must have a piece to move
    if (!piece) return false;
    
    const color = piece[0];
    const pieceType = piece[1];
    
    // Can't move to same square
    if (fromRow === toRow && fromCol === toCol) return false;
    
    // CRITICAL FIX: Cannot capture own pieces
    if (targetPiece && targetPiece[0] === color) {
        return false;
    }
    
    // CRITICAL FIX: Cannot capture the king (should never happen in valid chess)
    if (targetPiece && targetPiece[1] === 'K') {
        return false;
    }
    
    // Handle castling as special case
    if (pieceType === 'K' && Math.abs(fromCol - toCol) === 2) {
        return isValidCastlingMove(fromRow, fromCol, toRow, toCol);
    }
    
    // Validate basic piece movement
    let isValidBasicMove = false;
    switch (pieceType) {
        case 'P':
            isValidBasicMove = isValidPawnMove(fromRow, fromCol, toRow, toCol, color);
            break;
        case 'R':
            isValidBasicMove = isValidRookMove(fromRow, fromCol, toRow, toCol);
            break;
        case 'N':
            isValidBasicMove = isValidKnightMove(fromRow, fromCol, toRow, toCol);
            break;
        case 'B':
            isValidBasicMove = isValidBishopMove(fromRow, fromCol, toRow, toCol);
            break;
        case 'Q':
            isValidBasicMove = isValidQueenMove(fromRow, fromCol, toRow, toCol);
            break;
        case 'K':
            isValidBasicMove = isValidKingMove(fromRow, fromCol, toRow, toCol);
            break;
        default:
            return false;
    }
    
    if (!isValidBasicMove) return false;
    
    // CRITICAL FIX: Prevent king-to-king adjacency
    if (pieceType === 'K') {
        const opponentColor = color === 'w' ? 'b' : 'w';
        for (let r = toRow - 1; r <= toRow + 1; r++) {
            for (let c = toCol - 1; c <= toCol + 1; c++) {
                if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
                    board[r][c] === opponentColor + 'K') {
                    return false;
                }
            }
        }
    }

    // After making temporary move, check for king adjacency
    if (areKingsAdjacent()) {
    board[fromRow][fromCol] = piece;
    board[toRow][toCol] = originalTargetPiece;
    return false;
    }
    
    // Check if this move would leave own king in check
    return !wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol);
}



function wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const color = piece[0];
    const originalTargetPiece = board[toRow][toCol];
    
    // Make temporary move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Handle en passant capture temporarily
    let capturedPawn = null;
    if (piece[1] === 'P' && enPassantTarget && 
        enPassantTarget.row === toRow && enPassantTarget.col === toCol) {
        capturedPawn = board[fromRow][toCol];
        board[fromRow][toCol] = null;
    }
    
    const wouldBeInCheck = isInCheck(color);
    
    // Restore board
    board[fromRow][fromCol] = piece;
    board[toRow][toCol] = originalTargetPiece;
    if (capturedPawn) {
        board[fromRow][toCol] = capturedPawn;
    }
    
    return wouldBeInCheck;
}

function hasLegalMoves(color) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece && piece[0] === color) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}


function hasInsufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c]) {
                pieces.push(board[r][c]);
            }
        }
    }
    
    // Only kings
    if (pieces.length === 2) return true;
    
    // King vs King + Knight/Bishop
    if (pieces.length === 3) {
        const nonKings = pieces.filter(p => p[1] !== 'K');
        if (nonKings.length === 1 && (nonKings[0][1] === 'N' || nonKings[0][1] === 'B')) {
            return true;
        }
    }
    
    // King + Bishop vs King + Bishop (same color squares)
    if (pieces.length === 4) {
        const bishops = pieces.filter(p => p[1] === 'B');
        if (bishops.length === 2) {
            // Check if bishops are on same color squares
            let whiteBishopSquare = null, blackBishopSquare = null;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (board[r][c] && board[r][c][1] === 'B') {
                        if (board[r][c][0] === 'w') whiteBishopSquare = (r + c) % 2;
                        else blackBishopSquare = (r + c) % 2;
                    }
                }
            }
            return whiteBishopSquare === blackBishopSquare;
        }
    }
    
    return false;
}

function isDeadPosition() {
    const pieces = [];
    const positions = [];
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c]) {
                pieces.push(board[r][c]);
                positions.push({piece: board[r][c], row: r, col: c});
            }
        }
    }
    
    // King vs King + two knights (cannot force checkmate)
    if (pieces.length === 4) {
        const knights = pieces.filter(p => p[1] === 'N');
        if (knights.length === 2 && knights[0][0] === knights[1][0]) {
            return true;
        }
    }
    
    // King + Bishop vs King + Bishop (opposite color bishops)
    if (pieces.length === 4) {
        const bishops = positions.filter(p => p.piece[1] === 'B');
        if (bishops.length === 2) {
            const square1 = (bishops[0].row + bishops[0].col) % 2;
            const square2 = (bishops[1].row + bishops[1].col) % 2;
            return square1 !== square2;
        }
    }
    
    return false;
}

function isPerpetualCheck() {
    if (moveHistory.length < 6) return false;
    
    // Check if last 3 moves by each side are identical (perpetual check pattern)
    const recentMoves = moveHistory.slice(-6);
    return recentMoves[0] === recentMoves[4] && 
           recentMoves[1] === recentMoves[5] && 
           recentMoves[2] === recentMoves[6];
}

function hasThreefoldRepetition() {
    const currentPosition = getPositionKey();
    let count = 0;
    
    // Count occurrences of current position
    for (let pos of positionHistory) {
        if (pos === currentPosition) {
            count++;
        }
    }
    
    // Include current position
    count++;
    
    return count >= THREEFOLD_REPETITION_LIMIT;
}

function getPositionKey() {
    return JSON.stringify({
        board: board,
        currentPlayer: currentPlayer,
        castlingRights: castlingRights,
        enPassantTarget: enPassantTarget
    });
}
let moveConfirmationEnabled = false;

function enableMoveConfirmation() {
    moveConfirmationEnabled = true;
}

function confirmMove(fromRow, fromCol, toRow, toCol) {
    if (!moveConfirmationEnabled) {
        return makeMove(fromRow, fromCol, toRow, toCol);
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'move-confirm-dialog';
    dialog.innerHTML = `
        <h3>Confirm Move</h3>
        <p>${getPieceFullName(board[fromRow][fromCol])} from ${getSquareNotation(fromRow, fromCol)} to ${getSquareNotation(toRow, toCol)}</p>
        <div>
            <button onclick="executeConfirmedMove(${fromRow}, ${fromCol}, ${toRow}, ${toCol})">Confirm</button>
            <button onclick="cancelMove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(dialog);
}

function toAlgebraicNotation(piece, fromRow, fromCol, toRow, toCol, isCapture, isCheck, isCheckmate, isCastling, isPromotion) {
    if (isCastling) {
        return toCol > fromCol ? "O-O" : "O-O-O";
    }
    
    const pieceSymbol = piece[1] === 'P' ? '' : piece[1];
    const toSquare = getSquareNotation(toRow, toCol);
    const captureSymbol = isCapture ? 'x' : '';
    const checkSymbol = isCheckmate ? '#' : (isCheck ? '+' : '');
    const promotionSymbol = isPromotion ? `=${isPromotion}` : '';
    
    // Handle ambiguity for pieces other than pawns
    let disambiguator = '';
    if (piece[1] !== 'P') {
        // Find other pieces of same type that can move to same square
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === piece && (r !== fromRow || c !== fromCol) && 
                    isValidMove(r, c, toRow, toCol)) {
                    if (fromCol !== c) {
                        disambiguator = String.fromCharCode(97 + fromCol);
                    } else {
                        disambiguator = (8 - fromRow).toString();
                    }
                    break;
                }
            }
        }
    }
    
    // For pawn captures, include file
    if (piece[1] === 'P' && isCapture) {
        disambiguator = String.fromCharCode(97 + fromCol);
    }
    
    return pieceSymbol + disambiguator + captureSymbol + toSquare + promotionSymbol + checkSymbol;
}

function getPieceFullName(piece) {
    if (!piece) return '';
    
    const color = piece[0] === 'w' ? 'Gold' : 'Red';
    const pieceType = piece[1];
    
    const pieceNames = {
        'P': 'Pawn',
        'R': 'Rook', 
        'N': 'Knight',
        'B': 'Bishop',
        'Q': 'Queen',
        'K': 'King'
    };
    
    return `${color} ${pieceNames[pieceType]}`;
}

function getSquareNotation(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function createMoveDescription(piece, fromRow, fromCol, toRow, toCol, capturedPiece, enPassantCapture) {
    let moveDescription;
    
    if (piece[1] === 'K' && Math.abs(fromCol - toCol) === 2) {
        const isKingSide = toCol > fromCol;
        moveDescription = `${piece[0] === 'w' ? 'Gold' : 'Red'} castled ${isKingSide ? 'king-side' : 'queen-side'}`;
    } else {
        moveDescription = `${getPieceFullName(piece)} from ${getSquareNotation(fromRow, fromCol)} to ${getSquareNotation(toRow, toCol)}`;
        
        if (capturedPiece) {
            moveDescription += ` (captured ${getPieceFullName(capturedPiece)})`;
        } else if (enPassantCapture) {
            moveDescription += ' (en passant capture)';
        }
    }
    
    return moveDescription;
}

function createBoard() {
    const boardElement = document.getElementById('chessBoard');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.onclick = () => handleSquareClick(row, col);
            
            if (board[row][col]) {
                square.textContent = pieces[board[row][col]];
                square.style.cssText = board[row][col][0] === 'w' ? goldPieceStyle : redPieceStyle;
            }
            
            boardElement.appendChild(square);
        }
    }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    const color = piece[0];
    
    // Save current position to history before making move
    positionHistory.push(getPositionKey());
    
    // Save move for undo functionality
    gameHistory.push({
        board: board.map(row => [...row]),
        currentPlayer: currentPlayer,
        enPassantTarget: enPassantTarget ? {...enPassantTarget} : null,
        castlingRights: {...castlingRights},
        halfMoveClock: halfMoveClock
    });
    
    // Handle en passant capture
    let enPassantCapture = false;
    if (piece[1] === 'P' && enPassantTarget && 
        enPassantTarget.row === toRow && enPassantTarget.col === toCol) {
        board[fromRow][toCol] = null;
        enPassantCapture = true;
    }
    
    // Update castling rights
    updateCastlingRights(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
    
    // Update half-move clock for 50-move rule
    if (piece[1] === 'P' || capturedPiece || enPassantCapture) {
        halfMoveClock = 0;
    } else {
        halfMoveClock++;
    }
    
    // Make the move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Handle castling - move the rook
    if (piece[1] === 'K' && Math.abs(fromCol - toCol) === 2) {
        const isKingSide = toCol > fromCol;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? 5 : 3;
        
        board[fromRow][rookToCol] = board[fromRow][rookFromCol];
        board[fromRow][rookFromCol] = null;
        playCastleSound(); // Add castle sound
    }
    
    // Set en passant target for next move
    enPassantTarget = null;
    if (piece[1] === 'P' && Math.abs(fromRow - toRow) === 2) {
        enPassantTarget = {
            row: fromRow + (toRow - fromRow) / 2,
            col: fromCol
        };
    }
    
    // Create algebraic notation
    const isCapture = capturedPiece || enPassantCapture;
    const isCastling = piece[1] === 'K' && Math.abs(fromCol - toCol) === 2;
    let isPromotion = false;

    const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
    const inCheck = isInCheck(nextPlayer);
    const inCheckmate = inCheck && !hasLegalMoves(nextPlayer);

    const moveDescription = toAlgebraicNotation(piece, fromRow, fromCol, toRow, toCol, 
        isCapture, inCheck, inCheckmate, isCastling, isPromotion);
    
    // Add to move history
    moveHistory.push(moveDescription);
    currentMoveIndex = moveHistory.length - 1;
    updateMoveHistory();
    
    // Play appropriate sound
    if (isCapture || enPassantCapture) {
        playCaptureSound();
    } else {
        playMoveSound();
    }
    
    // CRITICAL: Update board visual immediately
    createBoard();
}

function trackGameState() {
    const gameState = {
        position: exportToFEN(),
        lastMove: moveHistory[moveHistory.length - 1],
        timeRemaining: {
            white: gameTimer.white,
            black: gameTimer.black
        },
        gameStatus: getDetailedGameStatus(),
        timestamp: new Date().toISOString()
    };
    
    // Save to tournament log
    console.log('Game State:', gameState);
    return gameState;
}

function getDetailedGameStatus() {
    if (gameOver) {
        if (isInCheck(currentPlayer) && !hasLegalMoves(currentPlayer)) {
            return `Checkmate - ${currentPlayer === 'w' ? 'Black' : 'White'} wins`;
        }
        const drawType = checkForDraw();
        if (drawType) return `Draw by ${drawType}`;
    }
    
    if (isInCheck(currentPlayer)) return `${currentPlayer === 'w' ? 'White' : 'Black'} in check`;
    return `${currentPlayer === 'w' ? 'White' : 'Black'} to move`;
}

// Add to your existing code
function initializeTournamentTimer(whiteTime = 900000, blackTime = 900000) {
    gameTimer = {
        white: whiteTime, // 15 minutes default
        black: blackTime,
        currentStart: Date.now(),
        interval: null,
        increment: 0 // Fischer increment
    };
    startTimer();
}

function startTimer() {
    if (gameTimer.interval) clearInterval(gameTimer.interval);
    
    gameTimer.interval = setInterval(() => {
        if (!gameOver && gameStarted) {
            const elapsed = Date.now() - gameTimer.currentStart;
            if (currentPlayer === 'w') {
                gameTimer.white = Math.max(0, gameTimer.white - elapsed);
            } else {
                gameTimer.black = Math.max(0, gameTimer.black - elapsed);
            }
            gameTimer.currentStart = Date.now();
            updateTimerDisplay();
            
            // Check for timeout
            if (gameTimer.white <= 0 || gameTimer.black <= 0) {
                handleTimeOut();
            }
        }
    }, 100);
}

function handleSquareClick(row, col) {
    if (gameOver || pendingPromotion) return;
    
    // Restrict first move to white only
    if (!gameStarted && currentPlayer !== 'w') {
        showCheckAlert("Gold pieces must move first!");
        return;
    }
    
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare;
        
        if (row === selectedRow && col === selectedCol) {
            clearSelection();
            return;
        }
        
        if (isValidMove(selectedRow, selectedCol, row, col)) {
            // Prevent capturing the king
            if (board[row][col] && board[row][col][1] === 'K') {
                clearSelection();
                return;
            }
            
            // Check for pawn promotion
            if (checkPawnPromotion(selectedRow, selectedCol, row, col)) {
                pendingPromotion = {fromRow: selectedRow, fromCol: selectedCol, toRow: row, toCol: col};
                makeMove(selectedRow, selectedCol, row, col);
                clearSelection();
                showPromotionDialog(currentPlayer, row, col);
                return;
            }
            
            makeMove(selectedRow, selectedCol, row, col);
            clearSelection();
            gameStarted = true;
            currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
            
            // Check for check and checkmate
            if (isInCheck(currentPlayer)) {
                if (isCheckmate(currentPlayer)) {
                    gameOver = true;
                    playCheckmateSound();
                    setTimeout(() => {
                        showGameOverDialog(`Checkmate! ${currentPlayer === 'w' ? 'Red' : 'Gold'} wins!`, 'checkmate');
                    }, 500);
                } else {
                    playCheckSound();
                    setTimeout(() => {
                        showCheckAlert(`${currentPlayer === 'w' ? 'Gold' : 'Red'} is in check!`);
                    }, 100);
                }
            }
            
            // Check for draw
            const drawType = checkForDraw();
            if (drawType) {
                gameOver = true;
                playDrawSound();
                let drawMessage = getDrawMessage(drawType);
                setTimeout(() => {
                    showGameOverDialog(drawMessage, 'draw');
                }, 500);
            }
            
            updateGameStatus();
        } else {
            playIllegalMoveSound();
            clearSelection();
            if (board[row][col] && board[row][col][0] === currentPlayer) {
                selectSquare(row, col);
            }
        }
    } else {
        if (board[row][col] && board[row][col][0] === currentPlayer) {
            selectSquare(row, col);
        } else if (board[row][col]) {
            playIllegalMoveSound();
            
        }
    }
}

function getDrawMessage(drawType) {
    const messages = {
        'stalemate': 'Draw by stalemate!',
        'insufficient': 'Draw by insufficient material!',
        'repetition': 'Draw by threefold repetition!',
        'fifty': 'Draw by 50-move rule!',
        'dead': 'Draw by dead position!',
        'perpetual': 'Draw by perpetual check!'
    };
    return messages[drawType] || 'Game drawn!';
}

function showGameOverDialog(message, type) {
    const dialog = document.createElement('div');
    dialog.className = 'game-over-dialog';
    dialog.id = 'gameOverDialog';
    
    const iconMap = {
        'checkmate': '♔',
        'draw': '½',
        'stalemate': '⚮'
    };
    
    dialog.innerHTML = `
        <div class="game-over-content">
            <div class="game-over-icon">${iconMap[type] || '!'}</div>
            <h2>${message}</h2>
            <div class="game-over-buttons">
                <button onclick="closeGameOverDialog()" class="btn-secondary">Continue</button>
                <button onclick="resetGame(); closeGameOverDialog();" class="btn-primary">New Game</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (document.getElementById('gameOverDialog')) {
            closeGameOverDialog();
        }
    }, 10000);
}

function closeGameOverDialog() {
    const dialog = document.getElementById('gameOverDialog');
    if (dialog) {
        dialog.remove();
    }
}

function selectSquare(row, col) {
    selectedSquare = [row, col];
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    square.classList.add('selected');
    highlightValidMoves(row, col);
}

function clearSelection() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('selected', 'valid-move', 'attack-path-gold', 'attack-path-red');
    });
    selectedSquare = null;
}

const arbiterFunctions = {
    pauseGame() {
        if (gameTimer.interval) {
            clearInterval(gameTimer.interval);
            gameTimer.paused = true;
        }
    },
    
    resumeGame() {
        if (gameTimer.paused) {
            gameTimer.currentStart = Date.now();
            startTimer();
            gameTimer.paused = false;
        }
    },
    
    adjustTime(color, timeInMs) {
        if (color === 'white') gameTimer.white = timeInMs;
        else gameTimer.black = timeInMs;
        updateTimerDisplay();
    },
    
    forceMove(fromSquare, toSquare) {
        // Emergency move function for arbiter
        const [fromRow, fromCol] = parseSquare(fromSquare);
        const [toRow, toCol] = parseSquare(toSquare);
        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
            makeMove(fromRow, fromCol, toRow, toCol);
        }
    }
};

function highlightValidMoves(row, col) {
    const piece = board[row][col];
    const isGoldPiece = piece && piece[0] === 'w';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(row, col, r, c)) {
                const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                square.classList.add('valid-move');

                // Add castling styling if it's a castling move
                if (piece[1] === 'K' && Math.abs(col - c) === 2) {
                    square.classList.add('castling-move');
                }

                // Add attack path styling
                if (isGoldPiece) {
                    square.classList.add('attack-path-gold');
                } else {
                    square.classList.add('attack-path-red');
                }
            }
        }
    }
}


function showCheckAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'check-alert';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 2000);
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
    const direction = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    
    // Forward move
    if (fromCol === toCol && !board[toRow][toCol]) {
        if (toRow === fromRow + direction) return true;
        if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol]) return true;
    }
    
    // Capture (including en passant)
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
        // Regular capture
        if (board[toRow][toCol] && board[toRow][toCol][0] !== color) {
            return true;
        }
        
        // En passant capture
        if (enPassantTarget && 
            enPassantTarget.row === toRow && 
            enPassantTarget.col === toCol &&
            board[fromRow][toCol] && 
            board[fromRow][toCol][1] === 'P' && 
            board[fromRow][toCol][0] !== color) {
            return true;
        }
    }
    
    return false;
}

function isValidEnPassant(fromRow, fromCol, toRow, toCol) {
    if (!enPassantTarget) return false;
    
    const piece = board[fromRow][fromCol];
    if (piece[1] !== 'P') return false;
    
    const direction = piece[0] === 'w' ? -1 : 1;
    
    // Must be moving diagonally forward
    if (toRow !== fromRow + direction || Math.abs(toCol - fromCol) !== 1) {
        return false;
    }
    
    // Must be capturing on en passant square
    if (toRow !== enPassantTarget.row || toCol !== enPassantTarget.col) {
        return false;
    }
    
    // Must be a pawn of opposite color that moved two squares
    const targetPawn = board[fromRow][toCol];
    return targetPawn && targetPawn[1] === 'P' && targetPawn[0] !== piece[0];
}

function checkPawnPromotion(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (piece && piece[1] === 'P') {
        const color = piece[0];
        const promotionRow = color === 'w' ? 0 : 7;
        if (toRow === promotionRow) {
            return true;
        }
    }
    return false;
}

function showPromotionDialog(color, row, col) {
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.id = 'promotionDialog';
    
    const pieceStyle = color === 'w' ? goldPieceStyle : redPieceStyle;
    
    dialog.innerHTML = `
        <h3>Promote your pawn to:</h3>
        <div class="promotion-pieces">
            <div class="promotion-piece" onclick="promotePawn('${color}Q', ${row}, ${col})">
                <span style="${pieceStyle}">${pieces[color + 'Q']}</span>
                <div>Queen</div>
            </div>
            <div class="promotion-piece" onclick="promotePawn('${color}R', ${row}, ${col})">
                <span style="${pieceStyle}">${pieces[color + 'R']}</span>
                <div>Rook</div>
            </div>
            <div class="promotion-piece" onclick="promotePawn('${color}B', ${row}, ${col})">
                <span style="${pieceStyle}">${pieces[color + 'B']}</span>
                <div>Bishop</div>
            </div>
            <div class="promotion-piece" onclick="promotePawn('${color}N', ${row}, ${col})">
                <span style="${pieceStyle}">${pieces[color + 'N']}</span>
                <div>Knight</div>
            </div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Auto-promotes to Queen in <span id="promotionTimer">15</span> seconds
        </p>
    `;
    
    document.body.appendChild(dialog);
    
    // Start countdown timer - FIXED to be exactly 15 seconds
    let timeLeft = 15;
    const timerElement = document.getElementById('promotionTimer');
    const countdown = setInterval(() => {
        timeLeft--;
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
            clearInterval(countdown);
        }
    }, 1000);
    
    // Auto-promote after EXACTLY 15 seconds
    const autoPromoteTimeout = setTimeout(() => {
        if (pendingPromotion && document.getElementById('promotionDialog')) {
            promotePawn(color + 'Q', row, col);
        }
    }, 15000); // Exactly 15 seconds
    
    // Store timeout reference for cleanup
    dialog.autoPromoteTimeout = autoPromoteTimeout;
}
function promotePawn(newPiece, row, col) {
    board[row][col] = newPiece;
    
    // CRITICAL: Update board visual immediately
    createBoard();
    
    // Remove dialog and cleanup
    const dialog = document.querySelector('.promotion-dialog');
    if (dialog) {
        if (dialog.autoPromoteTimeout) {
            clearTimeout(dialog.autoPromoteTimeout);
        }
        dialog.remove();
    }
    
    // Play promotion sound
    playPromotionSound();
    
    // Continue with game logic
    pendingPromotion = null;
    currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
    
    // Check for check and checkmate after promotion
    if (isInCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            gameOver = true;
            playCheckmateSound();
            showGameOverDialog(`Checkmate! ${currentPlayer === 'w' ? 'Red' : 'Gold'} wins!`, 'checkmate');
        } else {
            playCheckSound();
            showCheckAlert(`${currentPlayer === 'w' ? 'Gold' : 'Red'} is in check!`);
        }
    }
    
    // Check for draw conditions
    const drawType = checkForDraw();
    if (drawType) {
        gameOver = true;
        playDrawSound();
        let drawMessage = getDrawMessage(drawType);
        showGameOverDialog(drawMessage, 'draw');
    }
    
    updateGameStatus();
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    if (rowDiff !== colDiff) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return rowDiff <= 1 && colDiff <= 1;
}


function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowDir = Math.sign(toRow - fromRow);
    const colDir = Math.sign(toCol - fromCol);
    
    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol]) return false;
        currentRow += rowDir;
        currentCol += colDir;
    }
    
    return true;
}



function updateGameStatus() {
    const status = document.getElementById('gameStatus');
    if (gameOver) {
        const drawType = checkForDraw();
        if (drawType) {
            status.textContent = 'Game Drawn';
            status.className = 'game-status draw-status';
        } else {
            status.textContent = `Game Over - ${currentPlayer === 'w' ? 'Red' : 'Gold'} wins!`;
            status.className = 'game-status';
            status.style.color = '#ff4444';
        }
    } else {
        status.textContent = `${currentPlayer === 'w' ? 'Gold' : 'Red'} to move`;
        status.className = `game-status ${currentPlayer === 'w' ? 'gold-turn' : 'red-turn'}`;
    }
}

function updateMoveHistory() {
    const historyElement = document.getElementById('moveHistory');
    
    if (moveHistory.length === 0) {
        historyElement.innerHTML = '<h3>Move History:</h3><p>No moves yet</p>';
        return;
    }
    
    const currentMove = moveHistory[currentMoveIndex];
    const moveNumber = currentMoveIndex + 1;
    
    historyElement.innerHTML = `
        <h3>Move History:</h3>
        <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
            <button onclick="previousMove()" ${currentMoveIndex <= 0 ? 'disabled' : ''}>←</button>
            <span style="flex: 1; text-align: center;">Move ${moveNumber} of ${moveHistory.length}</span>
            <button onclick="nextMove()" ${currentMoveIndex >= moveHistory.length - 1 ? 'disabled' : ''}>→</button>
        </div>
        <div style="padding: 10px; background: #f0f0f0; border-radius: 5px; margin: 10px 0;">
            ${currentMove}
        </div>
    `;
}

function previousMove() {
    if (currentMoveIndex > 0) {
        currentMoveIndex--;
        updateMoveHistory();
    }
}

function nextMove() {
    if (currentMoveIndex < moveHistory.length - 1) {
        currentMoveIndex++;
        updateMoveHistory();
    }
}

function navigateToMove(moveIndex) {
    if (moveIndex < 0 || moveIndex >= gameHistory.length) return;
    
    const targetState = gameHistory[moveIndex];
    board = targetState.board.map(row => [...row]);
    currentPlayer = targetState.currentPlayer;
    enPassantTarget = targetState.enPassantTarget;
    castlingRights = {...targetState.castlingRights};
    halfMoveClock = targetState.halfMoveClock;
    
    currentMoveIndex = moveIndex;
    createBoard();
    updateGameStatus();
    updateMoveHistory();
}

function resetGame() {
    board = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];
    currentPlayer = 'w';
    selectedSquare = null;
    gameHistory = [];
    moveHistory = [];
    currentMoveIndex = -1;
    gameOver = false;
    pendingPromotion = null;
    enPassantTarget = null;
    gameStarted = false;
    castlingRights = {
        wK: true, wQ: true, bK: true, bQ: true
    };
    positionHistory = [];
    halfMoveClock = 0;
    
    // Clear performance cache
    clearMoveCache();
    
    // Remove any promotion dialog
    const existingDialog = document.getElementById('promotionDialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    createBoard();
    updateGameStatus();
    updateMoveHistory();
}

function exportToPGN() {
    const headers = [
        '[Event "Chess Game"]',
        '[Site "Web Browser"]',
        `[Date "${new Date().toISOString().split('T')[0]}"]`,
        '[Round "1"]',
        '[White "Gold Player"]',
        '[Black "Red Player"]',
        '[Result "*"]'
    ];
    
    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moveHistory[i];
        const blackMove = moveHistory[i + 1] || '';
        moves.push(`${moveNumber}. ${whiteMove} ${blackMove}`.trim());
    }
    
    return headers.join('\n') + '\n\n' + moves.join(' ');
}

function importFromPGN(pgnText) {
    // Basic PGN parsing - would need more robust implementation
    const lines = pgnText.split('\n');
    const moveLines = lines.filter(line => !line.startsWith('[') && line.trim());
    
    if (moveLines.length === 0) return false;
    
    resetGame();
    // Implementation would parse and replay moves
    console.log('PGN import not fully implemented');
    return true;
}

function exportToFEN() {
    let fen = '';
    
    // Board position
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        for (let col = 0; col < 8; col++) {
            if (board[row][col]) {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                let piece = board[row][col];
                fen += piece[0] === 'w' ? piece[1].toUpperCase() : piece[1].toLowerCase();
            } else {
                emptyCount++;
            }
        }
        if (emptyCount > 0) fen += emptyCount;
        if (row < 7) fen += '/';
    }
    
    // Active color
    fen += ` ${currentPlayer}`;
    
    // Castling rights
    let castling = '';
    if (castlingRights.wK) castling += 'K';
    if (castlingRights.wQ) castling += 'Q';
    if (castlingRights.bK) castling += 'k';
    if (castlingRights.bQ) castling += 'q';
    fen += ` ${castling || '-'}`;
    
    // En passant
    fen += ` ${enPassantTarget ? getSquareNotation(enPassantTarget.row, enPassantTarget.col) : '-'}`;
    
    // Half-move and full-move counters
    fen += ` ${halfMoveClock} ${Math.floor(moveHistory.length / 2) + 1}`;
    
    return fen;
}

function importFromFEN(fenString) {
    const parts = fenString.split(' ');
    if (parts.length !== 6) return false;
    
    try {
        // Reset board
        board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Parse board position
        const rows = parts[0].split('/');
        for (let row = 0; row < 8; row++) {
            let col = 0;
            for (let char of rows[row]) {
                if (isNaN(char)) {
                    const color = char === char.toUpperCase() ? 'w' : 'b';
                    const piece = color + char.toUpperCase();
                    board[row][col] = piece;
                    col++;
                } else {
                    col += parseInt(char);
                }
            }
        }
        
        // Set other game state
        currentPlayer = parts[1];
        
        // Parse castling rights
        castlingRights = {
            wK: parts[2].includes('K'),
            wQ: parts[2].includes('Q'),
            bK: parts[2].includes('k'),
            bQ: parts[2].includes('q')
        };
        
        // Parse en passant
        enPassantTarget = parts[3] === '-' ? null : {
            row: 8 - parseInt(parts[3][1]),
            col: parts[3].charCodeAt(0) - 97
        };
        
        halfMoveClock = parseInt(parts[4]);
        
        createBoard();
        updateGameStatus();
        return true;
    } catch (error) {
        console.error('Invalid FEN string:', error);
        return false;
    }
}

function exportGame() {
    const pgn = exportToPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess_game_${new Date().toISOString().split('T')[0]}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
}

function importGame() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pgn';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => importFromPGN(e.target.result);
        reader.readAsText(file);
    };
    input.click();
}

function copyFEN() {
    const fen = exportToFEN();
    navigator.clipboard.writeText(fen).then(() => {
        alert('FEN copied to clipboard!');
    });
}

function isSquareUnderAttack(row, col, defendingColor) {
    const attackingColor = defendingColor === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c][0] === attackingColor) {
                if (isValidMove(r, c, row, col)) {
                    return true;
                }
            }
        }
    }
    return false;
}
function isInCheck(color) {
    // Find the king
    let kingRow, kingCol;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === color + 'K') {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    // Check if any enemy piece can attack the king
    const enemyColor = color === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c][0] === enemyColor) {
                if (canPieceAttack(r, c, kingRow, kingCol)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function canPieceAttack(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const pieceType = piece[1];
    const color = piece[0];
    
    switch (pieceType) {
        case 'P':
            const direction = color === 'w' ? -1 : 1;
            return Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction;
        case 'R':
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'N':
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'B':
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'Q':
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'K':
            const rowDiff = Math.abs(fromRow - toRow);
            const colDiff = Math.abs(fromCol - toCol);
            return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);

        default:
            return false;
    }
}

function isCheckmate(color) {
    return isInCheck(color) && !hasAnyLegalMove(color);
}

// Initialize the game
createBoard();