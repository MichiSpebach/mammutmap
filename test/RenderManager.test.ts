import { RenderManager, Command } from '../src/RenderManager'

test('runOrSchedule one command', async () => {
  const renderManager = new RenderManager()
  let commandExecutionProof: boolean = false
  const command = buildCommand({command: () => {
    commandExecutionProof = true
    return Promise.resolve()
  }})

  await renderManager.runOrSchedule(command)

  expect(commandExecutionProof).toBe(true)
})

test('runOrSchedule two commands', async () => {
  const renderManager = new RenderManager()
  let counter: number = 0
  const command1 = buildCommand({command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command2 = buildCommand({command: () => {
    counter++
    return Promise.resolve(counter)
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)

  expect(await command1Result).toBe(1)
  expect(await command2Result).toBe(2)
})

test('runOrSchedule three commands, third overtakes second', async () => {
  const renderManager = new RenderManager()
  let counter: number = 0
  const command1 = buildCommand({affectedElementId: '1', priority: 1, command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command2 = buildCommand({affectedElementId: '2', priority: 1, command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command3 = buildCommand({affectedElementId: '3', priority: 2, command: () => {
    counter++
    return Promise.resolve(counter)
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)

  expect(await command1Result).toBe(1)
  expect(await command2Result).toBe(3)
  expect(await command3Result).toBe(2)
})

test('addCommand empty before', () => {
  const renderManager = new RenderManager()
  const command = buildCommand({})

  renderManager.addCommand(command)

  expect(renderManager.getCommands()).toHaveLength(1)
  expect(renderManager.getCommands()[0]).toEqual(command)
})

test('addCommand same priority', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({})
  const command2 = buildCommand({})

  renderManager.addCommand(command1)
  renderManager.addCommand(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toEqual(command1)
  expect(renderManager.getCommands()[1]).toEqual(command2)
})

test('addCommand increasing priority', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({priority: 1})
  const command2 = buildCommand({priority: 2})

  renderManager.addCommand(command1)
  renderManager.addCommand(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toEqual(command2)
  expect(renderManager.getCommands()[1]).toEqual(command1)
})

test('addCommand increasing and same priority', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({priority: 1})
  const command2 = buildCommand({priority: 2})
  const command3 = buildCommand({priority: 2})

  renderManager.addCommand(command1)
  renderManager.addCommand(command2)
  renderManager.addCommand(command3)

  expect(renderManager.getCommands()).toHaveLength(3)
  expect(renderManager.getCommands()[0]).toEqual(command2)
  expect(renderManager.getCommands()[1]).toEqual(command3)
  expect(renderManager.getCommands()[2]).toEqual(command1)
})

function buildCommand(options: {
  affectedElementId?: string,
  priority?: number,
  command?: () => Promise<any>
}) {
  return buildCommandFull(options.affectedElementId, options.priority, options.command)
}

function buildCommandFull(affectedElementId: string = 'elementId', priority: number = 1, command: () => Promise<any> = () => Promise.resolve()): Command {
  return new Command(affectedElementId, priority, 'genericType', command);
}
