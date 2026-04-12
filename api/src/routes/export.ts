import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:repoId/markdown', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    const { nodeIds, includeAnnotations, includeEmbeddings } = req.body;

    const markdown = `# Repository Documentation\n\nGenerated for: ${repoId}\n\n## Notes\n${includeAnnotations ? 'Includes annotations from team members.' : 'Annotations not included.'}\n\n## AI Descriptions\n${includeEmbeddings ? 'Includes AI-generated descriptions via Jina Embeddings.' : 'AI descriptions not included.'}`;

    res.json({
      markdown,
      filename: `${repoId}-docs.md`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
