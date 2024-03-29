import { MenuItemFile, applicationMenu, coreUtil, renderManager } from '../dist/pluginFacade';
import * as commandRegister from '../dist/core/commandRegister'

applicationMenu.addMenuItemTo('nyanCat.js', new MenuItemFile({label: 'spawn', click: () => spawn()}))
commandRegister.registerCommand('nyanCat', (parameter: string) => spawn())
commandRegister.registerCommand('nyancat', (parameter: string) => spawn())
commandRegister.registerCommand('nyan', (parameter: string) => spawn())
commandRegister.registerCommand('cat', (parameter: string) => spawn())

let musicPlaying = false;

const spawn = async () => {
	const nyancatId = 'nyancat' + coreUtil.generateId();
	const top = Math.random() * 100;
	const topEnd = Math.random() * 100;
	await renderManager.addElementTo('body', {
		type: 'div',
		id: nyancatId,
		style: {
			position: 'fixed',
			top: `${top}%`,
			transition: 'all 3s linear 0s',
			left: '-20%',
			cursor: 'pointer'
		},
		innerHTML: '<img style="height: 200px; width: 300px" src="https://media.tenor.com/-AyTtMgs2mMAAAAi/nyan-cat-nyan.gif">',
		onclick: () => {
			spawn();
			playMusic();
		}
	});
	
	while (true) {
		await coreUtil.wait(10);
		await renderManager.addStyleTo(nyancatId, {
			left: `100%`,
			top: `${topEnd}%`,
			transition: 'all 3s linear 0s',
		})
		await coreUtil.wait(3000);
		await renderManager.addStyleTo(nyancatId, {
			top: `${top}%`,
			left: `-20%`,
			transition: 'all 0s',
		})
	}
}

function playMusic(): void {
	if (musicPlaying) {
		return
	}
	try {
		const audio = new Audio('https://files.voicy.network/public/Content/Clips/Sound/c9243b3a-5a05-432e-88a8-48e4c5f9c93e.mp3')
		audio.loop = true;
		audio.play()
		musicPlaying = true
	} catch (error) {
		console.warn(`Failed to play music, most likely because of running in electron: ${error}`)
	}
}