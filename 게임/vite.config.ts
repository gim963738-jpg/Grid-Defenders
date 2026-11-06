import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: 'index.html',
        landscapeGame: 'battle-landscape.html',
        lobbyPreview: 'lobby-preview.html',
        battleLandscapePreview: 'battle-landscape-preview.html',
      },
    },
  },
});
