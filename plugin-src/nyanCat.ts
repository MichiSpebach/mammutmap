import { PopupWidget, coreUtil, renderManager } from '../dist/pluginFacade';

function performHelloWorld(): void {
	PopupWidget.newAndRender({
		title: 'Hello World!',
		content: {
			type: 'div',
			style: {color: 'lightgreen', cursor: 'pointer'},
			onclick: () => console.log('Hello World!'),
			children: 'Hello, nice to see you!'
		},
		onClose: () => console.log('Have a nice day!')
	})
}

const audio = new Audio('https://files.voicy.network/public/Content/Clips/Sound/c9243b3a-5a05-432e-88a8-48e4c5f9c93e.mp3')
audio.loop = true;
let isPlaying = false;

const a = async () => {
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
		},
		innerHTML: '<img style="height: 200px; width: 300px" src="https://media.tenor.com/-AyTtMgs2mMAAAAi/nyan-cat-nyan.gif">',
		onclick: () => {
			if (!isPlaying) {
				audio.play();
				isPlaying = true;
			}
			a();
		}
	});
	
	while (true) {
		await coreUtil.wait(10);
		await renderManager.setStyleTo(nyancatId, {
			left: `100%`,
			top: `${topEnd}%`,
			transition: 'all 3s linear 0s',
		})
		await coreUtil.wait(3000);
		await renderManager.setStyleTo(nyancatId, {
			top: `${top}%`,
			left: `-20%`,
			transition: 'all 0s',
		})
	}
}

a();