import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GameService } from './app.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GameService, AppController],
})
export class AppModule {}
