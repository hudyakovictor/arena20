// Тонкий адаптер Next.js → aibackend/http/router (весь бэкенд живёт в папке aibackend/)
import { dispatch } from '@aibackend/http/router';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path: string[] }> };
const h = async (req: Request, ctx: Ctx) => dispatch(req, (await ctx.params).path ?? []);

export { h as GET, h as POST, h as PUT, h as PATCH, h as DELETE };
