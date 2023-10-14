import { PopupWidget } from './PopupWidget'
import { RenderPriority, renderManager } from './RenderManager'
import { SimpleWidget } from './Widget'
import { LogEntry, log } from './logService'
import { RenderElements } from './util/RenderElement'
import * as commandLine from './commandLine'
import { util } from './util/util'

export class TerminalWidget extends SimpleWidget {
	private static maxDisplayedLogsCount = 50
	private rendered: boolean = false
	private displayedLogs: LogEntry[] = []
	private showAllLogsButtonDisplay: 'none'|'inline-block' = 'none'

	public constructor(id: string) {
		super(id, 'div')
	}
	
	private getLogId(): string {
		return `${this.id}-log`
	}

	private getCommandLineId(): string {
		return `${this.id}-commandLine`
	}

	private getShowAllLogsButtonId (): string {
		return `${this.getLogId()}-showAllLogs`
	}
	
	public override async unrender(): Promise<void> {
		log.warning('TerminalWidget::unrender() not implemented yet.')
	}
	
	protected override shapeInner(): RenderElements | Promise<RenderElements> {
		if (!this.rendered) {
			log.onAddLog.subscribe((logEntry: LogEntry) => this.addLogEntry(logEntry))
			log.onClearLog.subscribe((priority: RenderPriority|undefined) => this.clear(priority))
			this.displayedLogs = log.getLogs().slice(log.getLogs().length-TerminalWidget.maxDisplayedLogsCount)
			this.showAllLogsButtonDisplay = log.getLogs().length > TerminalWidget.maxDisplayedLogsCount ? 'inline-block' : 'none'
			;(async () => {
				await util.wait(0) // TODO improve this ASAP
				renderManager.scrollToBottom('bottomBar'/* TODO replace with this.id as soon as scrollbar is correctly implemented*/)
				renderManager.addKeydownListenerTo(this.getCommandLineId(), 'Enter', (value: string) => {
					renderManager.setValueTo(this.getCommandLineId(), '')
					commandLine.processCommand(value)
				})
			})()
		}
		this.rendered = true
		return [
			{
				type: 'div',
				id: this.getLogId(),
				style: {marginBottom: '15px'},
				children: [
					{
						type: 'button',
						id: this.getShowAllLogsButtonId(),
						style: {display: this.showAllLogsButtonDisplay},
						onclick: () => PopupWidget.buildAndRender('All Logs', log.getLogs().map(logEntry => logEntry.toRenderElement())),
						children: 'Show All Logs'
					},
					...this.displayedLogs.map(logEntry => logEntry.toRenderElement())
				]
			},
			{
				type: 'input',
				id: this.getCommandLineId(),
				className: 'commandLine',
				style: {width: '100%'}
			}
		]
	}

	private async addLogEntry(logEntry: LogEntry): Promise<void> {
		const pros: Promise<void>[] = []
		if (logEntry.count > 1) {
			const latestLogEntry: LogEntry|undefined = this.displayedLogs.pop()
			if (!latestLogEntry) {
				pros.push(this.addWarningPreventingInfiniteLoop(`There is something wrong with this logPanel, latestLogEntry is undefined.`))
			} else if (latestLogEntry.id !== logEntry.id) {
				pros.push(this.addWarningPreventingInfiniteLoop(`There is something wrong with this logPanel, latestLogEntry.id '${latestLogEntry.id}' does not match logEntry.id '${logEntry.id}'.`))
			}
			pros.push(renderManager.setContentTo(logEntry.id, logEntry.toHtmlString()))
		} else {
			pros.push(renderManager.addElementTo(this.getLogId(), logEntry.toRenderElement()))
		}
		this.displayedLogs.push(logEntry)
		await Promise.all(pros)
		await renderManager.scrollToBottom('bottomBar'/* TODO replace with this.id as soon as scrollbar is correctly implemented*/)
		await this.removeOldLogEntries()
	}

	private async addWarningPreventingInfiniteLoop(message: string): Promise<void> {
		await renderManager.addElementTo(this.getLogId(), {
			type: 'div',
			style: {color: 'red'},
			children: message
		})
	}

	private async removeOldLogEntries(): Promise<void> {
		const logsToRemove: LogEntry[] = []
        while (this.displayedLogs.length > TerminalWidget.maxDisplayedLogsCount) {
            logsToRemove.push(this.displayedLogs.shift()!)
        }
        const pros: Promise<void>[] = logsToRemove.map(log => renderManager.remove(log.id))
        if (logsToRemove.length > 0 && this.showAllLogsButtonDisplay !== 'inline-block') {
			this.showAllLogsButtonDisplay = 'inline-block'
            pros.push(renderManager.addStyleTo(this.getShowAllLogsButtonId(), {display: this.showAllLogsButtonDisplay}))
        }
        await Promise.all(pros)
    }

	private async clear(priority?: RenderPriority): Promise<void> {
		this.displayedLogs = []
		await renderManager.clearContentOf(this.getLogId(), priority)
	}
	
}