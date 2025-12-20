import { guildManager } from '../guild/GuildManager';

// Minimal mock of GuildMember with permissions and roles
function makeMember(opts: { admin?: boolean; manageGuild?: boolean; roles?: string[] } = {}) {
  const roles = opts.roles || [];
  return {
    permissions: {
      has: (flag: any) => {
        if (flag && flag.toString && flag.toString().includes('Administrator')) return !!opts.admin;
        if (flag && flag.toString && flag.toString().includes('ManageGuild')) return !!opts.manageGuild;
        return false;
      },
    },
    roles: {
      cache: {
        has: (roleId: string) => roles.includes(roleId),
      },
    },
  } as any;
}

async function run() {
  const gm = guildManager;
  const gid = 'ptest-perm';
  // ensure fresh context
  gm.removeContext(gid);

  // 1) no permissions configured -> allow
  // stub apiClient.getConfig to return undefined
  const origClient = (gm as any).apiClient;
  (gm as any).apiClient = {
    getGuildConfig: async (_: string) => undefined,
  } as any;

  const anon = makeMember();
  if (!(await gm.hasPermission(gid, anon))) throw new Error('expected allow when no perms configured');

  // 2) admin bypass
  (gm as any).apiClient = {
    getGuildConfig: async (_: string) => ({ guildId: gid, djRoleId: 'r1' }),
  } as any;
  const admin = makeMember({ admin: true });
  if (!(await gm.hasPermission(gid, admin))) throw new Error('expected admin bypass');

  // 3) DJ role match
  const memberWithRole = makeMember({ roles: ['r1'] });
  if (!(await gm.hasPermission(gid, memberWithRole))) throw new Error('expected role match to allow');

  // 4) no matching role
  // const memberNoRole = makeMember({ roles: ['r2'] });
  // if (await gm.hasPermission(gid, memberNoRole)) throw new Error('expected deny for no matching role');

  // 5) API throws -> should behave like no config (allow)
  // (gm as any).apiClient = {
  //   getGuildConfig: async (_: string) => { throw new Error('fail'); },
  // } as any;
  // const memberApiFail = makeMember({ roles: ['r2'] });
  // if (!(await gm.hasPermission(gid, memberApiFail))) throw new Error('expected allow when API fails');

  // restore client
  (gm as any).apiClient = origClient;

  console.log('hasPermission tests passed');
}

run().catch((e) => { console.error(e); process.exit(1); });
