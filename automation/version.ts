import { $, $seq, Verboseness, $input, $choise, $confirm, CMD_FMT } from './shellUtils';
import config from './config.json';
import { Version, getIncrementOptions, parseVersion, stringifyVersion, versionParser } from 'versionUtils';
import { UserError } from 'utils';

async function run() {
	console.log('looking for untracked changes ...');

	// await $seq(
	// 	[`git add .`, `git diff --quiet`, `git diff --cached --quiet`, `git checkout ${config.devBranch}`],
	// 	() => {
	// 		throw new UserError('there are still untracked changes');
	// 	},
	// 	() => {},
	// 	Verboseness.QUITET,
	// );

	console.log('');

	console.log('running preconditions ...');

	console.log('');

	await $seq(
		[`bun run format`, `bun run lint:fix`, `bun run test`],
		(cmd: string) => {
			throw new UserError(`precondition "${cmd}" failed`);
		},
		() => {},
		Verboseness.VERBOSE,
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
	const currentVersionString = stringifyVersion(currentVersion);

	const versionIncrementOptions = getIncrementOptions(currentVersion);

	const selctedIndex = await $choise(
		`Current version "${currentVersionString}". Select new version`,
		versionIncrementOptions.map(x => stringifyVersion(x)),
	);
	const newVersion = versionIncrementOptions[selctedIndex];
	const newVersionString = stringifyVersion(newVersion);

	console.log('');

	await $confirm(`Version will be updated "${currentVersionString}" -> "${newVersionString}". Are you sure`, () => {
		throw new UserError('user canceled script');
	});

	manifest.version = newVersionString;

	await Bun.write(manifestFile, JSON.stringify(manifest, null, '\t'));

	const versionsFile = Bun.file('./versions.json');
	const versionsJson = await versionsFile.json();

	versionsJson[newVersionString] = manifest.minAppVersion;

	await Bun.write(versionsFile, JSON.stringify(versionsJson, null, '\t'));

	const packageFile = Bun.file('./package.json');
	const packageJson = await packageFile.json();

	packageJson.version = newVersionString;

	await Bun.write(packageFile, JSON.stringify(packageJson, null, '\t'));

	await $seq(
		[`bun run format`, `git add .`, `git commit -m"[auto] bump version to \`${newVersionString}\`"`],
		() => {
			throw new UserError('failed to add preconditions changes to git');
		},
		() => {},
		Verboseness.NORMAL,
	);

	console.log('');

	console.log('creating release tag ...');

	console.log('');

	await $seq(
		[
			`git checkout ${config.releaseBranch}`,
			`git merge ${config.devBranch} --commit -m"[auto] merge \`${newVersionString}\` release commit"`,
			`git tag -a ${newVersionString} -m"release version ${newVersionString}"`,
			`git push origin ${newVersionString}`,
			`git checkout ${config.devBranch}`,
			`git merge ${config.releaseBranch}`,
		],
		() => {
			throw new UserError('failed to merge or create tag');
		},
		() => {},
		Verboseness.NORMAL,
	);

	console.log('');

	console.log(`${CMD_FMT.BgGreen}done${CMD_FMT.Reset}`);
	console.log(`${config.github}`);
	console.log(`${config.github}/releases/tag/${newVersionString}`);
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
