import { PopupWidget } from './PopupWidget'
import { util } from './util/util'

export class MessagePopup extends PopupWidget {
    private readonly message: string

    public static async buildAndRender(title: string, defaultValue: string): Promise<void> {
        const popup = new MessagePopup(title, defaultValue)
        await popup.render()
    }

    private constructor(title: string, message: string) {
        super('messagePopup'+util.generateId(), title)
        this.message = message
    }

    protected formContent(): string {
      return this.message
    }

    protected async afterRender(): Promise<void> {
    }

    protected async beforeUnrender(): Promise<void> {
    }

}
