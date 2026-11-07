/// <reference path="./runtime.d.ts" />
import { createPublicProjectsHandler } from './handler.ts';

Deno.serve(createPublicProjectsHandler(() => ({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
  PUBLIC_PROJECTS_ROLE_JWT: Deno.env.get('PUBLIC_PROJECTS_ROLE_JWT'),
})));
