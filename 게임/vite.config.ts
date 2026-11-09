import { defineConfig } from 'vite';
import { privateMaterials } from './tools/private-materials.mjs';

export default defineConfig({
  plugins: [privateMaterials()],
  build: {
    rollupOptions: {
      input: {
        game: 'index.html',
        landscapeGame: 'battle-landscape.html',
        lobbyPreview: 'lobby-preview.html',
        battleLandscapePreview: 'battle-landscape-preview.html',
        effectWorkshop: 'effect-workshop.html',
        effectGallery: 'effect-gallery.html',
        effectMaterials: 'effect-materials.html',
      },
    },
  },
});
