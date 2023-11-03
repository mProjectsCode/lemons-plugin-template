import { $, $seq, Verboseness, $input, $choise, $confirm } from './shellUtils';
import config from './config.json';
import { Version, getIncrementOptions, parseVersion, stringifyVersion, versionParser } from 'versionUtils';
import { UserError } from 'utils';

async function run() {
	console.log('looking for untracked changes ...');

	await $seq(
		[`git add .`, `git diff --quiet`, `git diff --cached --quiet`],
		() => {
			throw new UserError('there are still untracked changes');
		},
		() => {},
		Verboseness.QUITET,
	);

    console.log('');

    console.log('running preconditions ...');

    console.log('');

    await $seq(
		[`bun run format`, `bun run lint`, `bun run test`],
		(cmd: string) => {
			throw new UserError(`precondition "${cmd}" failed`);
		},
		() => {},
		Verboseness.QUITET,
	);

    await $seq(
		[`git add .`, `git commit -m"[auto] run release preconditions"`],
		() => {
			throw new UserError('failed to add preconditions changes to git');
		},
		() => {},
		Verboseness.NORMAL,
	);

    console.log('');

	console.log('bumping versions ...');

    console.log('');

	const manifestFile = Bun.file('./manifest.json');
	const manifest = await manifestFile.json();

	const versionString: string = manifest.version;
	const currentVersion: Version = parseVersion(versionString);
    const currentVersionString = stringifyVersion(currentVersion)

	const versionIncrementOptions = getIncrementOptions(currentVersion);

	const selctedIndex = await $choise(
		`Current version "${currentVersionString}". Select new version`,
		versionIncrementOptions.map(x => stringifyVersion(x)),
	);
	const newVersion = versionIncrementOptions[selctedIndex];
    const newVersionString = stringifyVersion(newVersion)

    console.log('');

	await $confirm(`Version will be updated "${currentVersionString}" -> "${newVersionString}". Are you sure`, () => {
		throw new UserError('user canceled script');
	});

    manifest.version = newVersionString;

    await Bun.write(
        manifestFile,
        JSON.stringify(manifest, null, 4),
    );

    const packageFile = Bun.file('./package.json');
    const packageJson = await packageFile.json();

    packageJson.version = newVersionString;

    await Bun.write(
        packageFile,
        JSON.stringify(packageJson, null, 4),
    );

    await $seq(
		[`git add .`, `git commit -m"[auto] bump version to \`${newVersionString}\`"`],
		() => {
			throw new UserError('failed to add preconditions changes to git');
		},
		() => {},
		Verboseness.NORMAL,
	);

	console.log('');

	console.log('creating release tag ...');
}

try {
	await run();
} catch (e) {
	if (e instanceof UserError) {
		console.error(e.message);
	} else {
		console.error(e);
	}
}

// await $(`git checkout ${config.devBranch}`);

// const commitName = await readInput('Commit Name');

// await $(`git add .`);

// console.log('name: ', commitName);

// await $(`ls`);
// await $(`git status`)
