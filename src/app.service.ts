import { Injectable } from '@nestjs/common';

interface Character {
  type: 'Pawn' | 'Hero1' | 'Hero2';
  position: [number, number];
}

interface Player {
  id: string;
  characters: { [key: string]: Character };
}

interface GameState {
  players: { [key: string]: Player };
  currentTurn: string;
  winner: string | null;
}

@Injectable()
export class GameService {
  private gameState: GameState;

  initializeGame(playerIds: [string, string]): GameState {
    this.gameState = {
      players: {},
      currentTurn: playerIds[0],
      winner: null,
    };

    playerIds.forEach((playerId, index) => {
      const startingRow = index === 0 ? 0 : 4;
      this.gameState.players[playerId] = {
        id: playerId,
        characters: {
          P1: { type: 'Pawn', position: [startingRow, 0] },
          P2: { type: 'Pawn', position: [startingRow, 1] },
          P3: { type: 'Pawn', position: [startingRow, 2] },
          H1: { type: 'Hero1', position: [startingRow, 3] },
          H2: { type: 'Hero2', position: [startingRow, 4] },
        },
      };
    });

    return this.gameState;
  }

  processMove(playerId: string, move: string): GameState {
    if (this.gameState.currentTurn !== playerId || this.gameState.winner) {
      return this.gameState;
    }

    const [characterId, direction] = move.split(':');
    console.log(characterId+ " "+ direction);
    const player = this.gameState.players[playerId];
    const character = player.characters[characterId];
    console.log(character);
    if (!character) {
      return this.gameState;
    }

    const newPosition = this.calculateNewPosition(character, direction);

    if (this.isValidMove(newPosition)) {
      this.removeCharacterAtPosition(newPosition);
      character.position = newPosition;
      this.checkWinCondition();
      this.switchTurn();
    }

    return this.gameState;
  }

  private calculateNewPosition(character: Character, direction: string): [number, number] {
    const [row, col] = character.position;
    const moveDistance = character.type === 'Pawn' ? 1 : 2;

    switch (direction) {
      case 'L': return [row, col - moveDistance];
      case 'R': return [row, col + moveDistance];
      case 'F': return [row - moveDistance, col];
      case 'B': return [row + moveDistance, col];
      case 'FL': return [row - moveDistance, col - moveDistance];
      case 'FR': return [row - moveDistance, col + moveDistance];
      case 'BL': return [row + moveDistance, col - moveDistance];
      case 'BR': return [row + moveDistance, col + moveDistance];
      default: return [row, col];
    }
  }

  private isValidMove(position: [number, number]): boolean {
    const [row, col] = position;
    return row >= 0 && row < 5 && col >= 0 && col < 5;
  }

  private removeCharacterAtPosition(position: [number, number]): void {
    Object.values(this.gameState.players).forEach(player => {
      Object.entries(player.characters).forEach(([characterId, character]) => {
        if (character.position[0] === position[0] && character.position[1] === position[1]) {
          delete player.characters[characterId];
        }
      });
    });
  }

  private checkWinCondition(): void {
    Object.entries(this.gameState.players).forEach(([playerId, player]) => {
      if (Object.keys(player.characters).length === 0) {
        const opponentId = Object.keys(this.gameState.players).find(id => id !== playerId);
        this.gameState.winner = opponentId;
      }
    });
  }

  private switchTurn(): void {
    const playerIds = Object.keys(this.gameState.players);
    this.gameState.currentTurn = this.gameState.currentTurn === playerIds[0] ? playerIds[1] : playerIds[0];
  }
}