import { NestFactory } from '@nestjs/core';
import { SpelunkerModule } from 'nestjs-spelunker';
import { AppModule } from './app.module';

export async function generateDiagram() {
  const app = await NestFactory.create(AppModule);

  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);

  // 2. Format as Mermaid Flowchart
  const mermaidEdges = edges
    .filter(({ from, to }) => {
      // Optional: Filter out internal NestJS or Logger modules to reduce noise
      return (
        !from.module.name.includes('Internal') &&
        !to.module.name.includes('Internal')
      );
    })
    .map(({ from, to }) => `${from.module.name} --> ${to.module.name}`);

  // console.log(`graph TD\n\t${mermaidEdges.join('\n\t')}`);
  await app.close();
}
