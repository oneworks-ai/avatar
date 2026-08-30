# PR #21 selective adaptation report

## Source and attribution

- Source PR: `oneworks-ai/avatar#21`, branch source `xxchan/avatar:otter-preset`.
- Source head: `04693016c1e1bb9b2f592cf857450f8412e8de93`.
- Source commits: `d700397`, `e211c42`, `ce45579`, `aba646d`, `7344d2a`, `0469301`.
- Author credit: `@xxchan`, original commit identity `exe.dev user <exedev@xxwork.exe.xyz>`.
- GitHub does not associate the original email with `@xxchan`; integration commits must use the linked trailer `Co-authored-by: xxchan <37948597+xxchan@users.noreply.github.com>` while retaining the original identity above as provenance.

## Adopted

- Red panda: warmer source palette, dark ear material, paired eye masks, pale muzzle marking, rounded-eye face proportions, dark teal preview composition.
- River otter: warmer brown palette, stronger ear/head contrast, compact pale muzzle marking, rounded-eye face proportions, cyan authored composition.
- Both markings are current object-space semantic surface decals bound to the real `primary` head owner.
- Current compiled renderer owns projection, visibility, horizon collapse, shared curve geometry and native SVG antialiasing.
- Existing red panda identity remains `entity=bear&breed=red-panda`; existing three-breed otter catalog remains intact.

## Not adopted

- No new top-level `red-panda` entity.
- No PR #21 legacy target IDs (`red-panda-head`, `otter-head`) or planar projection implementation.
- No floating or whole-part fake muzzle, screen-space bridge, z-offset, old center-depth behavior, or ellipse-eye default.
- No mechanical copy of old part counts, IDs, or geometry tests.
- Otter base head/ear geometry was retained because the current shared controls and three-breed constraints already own those proportions; only the reusable palette, marking and composition intent was adapted.

## Validation

- Multi-angle fixtures: front, yaw ±30/±60/±85, profile, pitch ±30, rear for red panda and river otter.
- DOM/owner result across all 22 poses: line segments `0`, null-owner pixels `0`, max curve error `0.125px`.
- Red panda exposes 3 curved `primary` surface markings; river otter exposes 1 curved `primary` surface marking.
- Targeted renderer/model suite: 5 files, 145 tests passed.
- Legacy share-link migration: 3 focused cases passed.
- TypeScript typecheck passed.
- Full URL/Definition/snapshot regression: 3 files, 212 tests passed after updating the expected authored river-otter color.
- Changes are local only: no commit, push, PR merge, or PR state mutation.
