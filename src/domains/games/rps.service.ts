// src/domains/games/rps.service.ts

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RpsService {
  private scores = new Map<
    string,
    { user: number; bot: number; matches: number }
  >();

  play(userId: string, userMove: 'rock' | 'paper' | 'scissors') {
    const moves: ('rock' | 'paper' | 'scissors')[] = [
      'rock',
      'paper',
      'scissors',
    ];
    const botMove = moves[Math.floor(Math.random() * 3)];

    console.log(
      `🎮 Game Start - User: ${userId} Move: ${userMove} vs Bot: ${botMove}`,
    );

    const state = this.scores.get(userId) || { user: 0, bot: 0, matches: 0 };

    // Logic to determine winner
    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (userMove !== botMove) {
      const winMap = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
      result = winMap[userMove] === botMove ? 'win' : 'loss';
    }

    if (result === 'win') state.user++;
    if (result === 'loss') state.bot++;
    state.matches++;

    this.scores.set(userId, state);

    const isGameOver = state.matches >= 5;
    const finalScore = isGameOver ? { ...state } : null;

    console.log(
      `📊 Current Score for ${userId}: User ${state.user} | Bot ${state.bot} (Match ${state.matches}/5)`,
    );

    if (isGameOver) {
      console.log(`🏁 GAME OVER for ${userId}. Final Score:`, finalScore);
    }

    return { userMove, botMove, result, currentState: state, finalScore };
  }

  @Cron('*/30 * * * *') // NestJS Schedule: Every 30 minutes
  resetAllScores() {
    this.scores.clear();
  }
}
