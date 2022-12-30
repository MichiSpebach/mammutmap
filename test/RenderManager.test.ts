import { mock, MockProxy } from 'jest-mock-extended'
import { init as initDomAdapter, BatchMethod, DocumentObjectModelAdapter } from '../src/domAdapter'
import { RenderManager, RenderPriority, SchedulablePromise, Command } from '../src/RenderManager'
import { RenderElements } from '../src/util/RenderElement'

test('SchedulablePromise simple call', async () => {
  const schedulablePromise = new SchedulablePromise(() => 'test is working')

  schedulablePromise.run()
  const result = await schedulablePromise.get()

  expect(result).toEqual('test is working')
})

test('SchedulablePromise wrap resolved Promise', async () => {
  const schedulablePromise = new SchedulablePromise(() => Promise.resolve('test is working'))

  schedulablePromise.run()
  const result = await schedulablePromise.get()

  expect(result).toEqual('test is working')
})

test('SchedulablePromise wrap Promise with timeout', async () => {
  const schedulablePromise = new SchedulablePromise(() => new Promise((resolve) => {
    setTimeout(resolve, 1)
    resolve('test is working')
  }))

  schedulablePromise.run()
  const result = await schedulablePromise.get()

  expect(result).toEqual('test is working')
})

test('runOrSchedule one command', async () => {
  const renderManager = new RenderManager()
  let commandExecutionProof: boolean = false
  const command = buildCommand({command: () => {
    commandExecutionProof = true
    return Promise.resolve()
  }})

  await renderManager.runOrSchedule(command)

  expect(commandExecutionProof).toBe(true)
  expect(renderManager.getCommands().length).toBe(0)
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
  expect(counter).toBe(2)
  expect(renderManager.getCommands().length).toBe(0)
})

test('runOrSchedule three commands, third overtakes second', async () => {
  const renderManager = new RenderManager()
  let counter: number = 0
  const command1 = buildCommand({priority: RenderPriority.NORMAL, command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command2 = buildCommand({priority: RenderPriority.NORMAL, command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command3 = buildCommand({priority: RenderPriority.RESPONSIVE, command: () => {
    counter++
    return Promise.resolve(counter)
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)
  expect(command1.promise.isStarted()).toBe(true)
  expect(command2.promise.isStarted()).toBe(false)

  expect(await command1Result).toBe(1)
  expect(await command2Result).toBe(3)
  expect(await command3Result).toBe(2)
  expect(counter).toBe(3)
  expect(renderManager.getCommands().length).toBe(0)
})

test('runOrSchedule, higher prioritized command is started although lower prioritized is still going on', async () => {
  const renderManager = new RenderManager()
  let command1Counter: number = 0
  let command2Counter: number = 0

  const command1Promise: SchedulablePromise<number> = new SchedulablePromise(() => {
    command1Counter++
    return command1Counter
  })

  const command1 = buildCommand({priority: RenderPriority.NORMAL, command: () => {
    return command1Promise.get()
  }})
  const command2 = buildCommand({priority: RenderPriority.RESPONSIVE, command: () => {
    command2Counter++
    return Promise.resolve(command2Counter)
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  expect(command1.promise.isStarted()).toBe(true)
  expect(command1Counter).toBe(0)
  expect(command2.promise.isStarted()).toBe(true)
  command1Promise.run()

  expect(await command1Result).toBe(1)
  expect(await command2Result).toBe(1)
  expect(command1Counter).toBe(1)
  expect(command2Counter).toBe(1)
  expect(renderManager.getCommands().length).toBe(0)
})

test('runOrSchedule squashable, does not squash into already started command', () => {
  const renderManager = new RenderManager()
  const commandDirectlyStarted = buildCommand({squashableWith: 'command'})
  const command2 = buildCommand({squashableWith: 'command'})

  renderManager.runOrSchedule(commandDirectlyStarted)
  renderManager.runOrSchedule(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(commandDirectlyStarted)
  expect(renderManager.getCommands()[1]).toBe(command2)
})

test('runOrSchedule squashable, priority is max of squashed commands', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({priority: RenderPriority.NORMAL})
  const command2 = buildCommand({priority: RenderPriority.NORMAL, squashableWith: 'command'})
  const command3 = buildCommand({priority: RenderPriority.RESPONSIVE, squashableWith: 'command'})

  renderManager.runOrSchedule(command1)
  renderManager.runOrSchedule(command2)
  renderManager.runOrSchedule(command3)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(command2)
  expect(renderManager.getCommands()[0].priority).toBe(RenderPriority.RESPONSIVE)
  expect(renderManager.getCommands()[1]).toBe(command1)
})

test('runOrSchedule squashable, redundant commands are skipped', async () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({command: () => Promise.resolve('command1Result')})
  const squashable: string = 'command'
  let squashableEqualButDynamicGenerated: string = ''
  for (let i: number = 0; i < squashable.length; i++) {
    squashableEqualButDynamicGenerated += squashable[i]
  }
  const command2 = buildCommand({command: () => Promise.resolve('command2Result(skipped)'), squashableWith: squashable})
  const command3 = buildCommand({command: () => Promise.resolve('command3Result'), squashableWith: squashableEqualButDynamicGenerated})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)
  expect(command2.promise.getCommand()).toBe(command3.promise.getCommand())

  expect(await command1Result).toBe('command1Result')
  expect(await command2Result).toBe('command3Result')
  expect(await command3Result).toBe('command3Result')
})

test('runOrSchedule squashable, commands not squashable', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({})
  const command2 = buildCommand({squashableWith: 'command2'})
  const command3 = buildCommand({squashableWith: 'command3'})

  renderManager.runOrSchedule(command1)
  renderManager.runOrSchedule(command2)
  renderManager.runOrSchedule(command3)

  expect(renderManager.getCommands()).toHaveLength(3)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)
  expect(renderManager.getCommands()[2]).toBe(command3)
})

test('runOrSchedule updatable, does not update already started command', () => {
  const renderManager = new RenderManager()
  const commandDirectlyStarted = buildCommand({squashableWith: 'commandPositive', updatableWith: 'commandNegative'})
  const command2 = buildCommand({squashableWith: 'commandNegative', updatableWith: 'commandPositive'})

  renderManager.runOrSchedule(commandDirectlyStarted)
  renderManager.runOrSchedule(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(commandDirectlyStarted)
  expect(renderManager.getCommands()[1]).toBe(command2)
})

test('runOrSchedule updatable, existing command is updated instead of new added', async () => {
  const renderManager = new RenderManager()
  let counter: number = 0
  const command1 = buildCommand({command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command2 = buildCommand({squashableWith: 'commandNegative', updatableWith: 'commandPositive', command: () => {
    counter--
    return Promise.resolve(counter)
  }})
  const command3 = buildCommand({squashableWith: 'commandPositive', updatableWith: 'commandNegative', command: () => {
    counter++
    return Promise.resolve(counter)
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)

  expect(await command1Result).toEqual(1)
  expect(await command2Result).toEqual(2)
  expect(await command3Result).toEqual(2)

  expect(counter).toEqual(2)
})

test('runOrSchedule updatable and squashable, squashable command can be squashed into updated command', async () => {
  const renderManager = new RenderManager()
  let command1Executed: boolean = false
  let command2Executed: boolean = false
  let command3Executed: boolean = false
  let command4Executed: boolean = false
  const command1 = buildCommand({command: () => {
    command1Executed = true
    return Promise.resolve()
  }})
  const command2 = buildCommand({squashableWith: 'commandPositive', updatableWith: 'commandNegative', command: () => {
    command2Executed = true
    return Promise.resolve()
  }})
  const command3 = buildCommand({squashableWith: 'commandNegative', updatableWith: 'commandPositive', command: () => {
    command3Executed = true
    return Promise.resolve()
  }})
  const command4 = buildCommand({squashableWith: 'commandNegative', updatableWith: 'commandPositive', command: () => {
    command4Executed = true
    return Promise.resolve()
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)
  const command4Result: Promise<number> = renderManager.runOrSchedule(command4)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)

  await Promise.all([command1Result, command2Result, command3Result, command4Result])

  expect(command1Executed).toEqual(true)
  expect(command2Executed).toEqual(false)
  expect(command3Executed).toEqual(false)
  expect(command4Executed).toEqual(true)
})

test('runOrSchedule with batchUpcommingCommandsInto one', async () => {
  const dom: MockProxy<DocumentObjectModelAdapter> = mock<DocumentObjectModelAdapter>()
  initDomAdapter(dom)
  const renderManager = new RenderManager()

  const command1 = buildCommand({priority: RenderPriority.NORMAL, batchValue: 'command1', command: () => Promise.resolve('command1')})
  const command2 = buildCommand({priority: RenderPriority.NORMAL, batchValue: 'command2', command: () => Promise.resolve('command2')})
  const command3 = buildCommand({priority: RenderPriority.NORMAL, batchValue: 'command3', command: () => Promise.resolve('command3')})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1) // runs directly, does not wait for other commands to batch
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)
  expect(command1.promise.isStarted()).toBe(true)
  expect(command2.promise.isStarted()).toBe(false)
  expect(command3.promise.isStarted()).toBe(false)

  await Promise.all([command1Result, command2Result, command3Result])

  expect(command1.promise.getCommand().toString()).toBe("() => Promise.resolve('command1')")
  expect(command2.promise.getCommand().toString()).toBe('() => domAdapter_1.dom.batch(batch)')
  expect(command3.promise.getCommand().toString()).toBe('() => Promise.resolve()') // not resolve('command3') because it was set to directly resolve by command2
  expect(dom.batch).toBeCalledTimes(1)
  expect(dom.batch).toBeCalledWith([
    {elementId: expect.any(String), method: expect.any(String), value: 'command2'},
    {elementId: expect.any(String), method: expect.any(String), value: 'command3'}
  ])
  expect(renderManager.getCommands().length).toBe(0)
})

test('runOrSchedule with batchUpcommingCommandsInto one, higher prioritized command is started before lower prioritized', async () => {
  const dom: MockProxy<DocumentObjectModelAdapter> = mock<DocumentObjectModelAdapter>()
  initDomAdapter(dom)
  const renderManager = new RenderManager()

  const commandsToBlockQueue: Command[] = []
  for (let i = 0; i < 3; i++) {
    const command: Command = buildCommand({priority: RenderPriority.RESPONSIVE, command: () => Promise.resolve()})
    commandsToBlockQueue.push(command)
  }
  const normalPrioCommand = buildCommand({priority: RenderPriority.NORMAL, batchValue: 'normalPrioCommand', command: () => Promise.resolve()})
  const highPrioCommand = buildCommand({priority: RenderPriority.RESPONSIVE, batchValue: 'highPrioCommand', command: () => Promise.resolve()})

  commandsToBlockQueue.map(command => renderManager.runOrSchedule(command))
  const normalPrioCommandResult: Promise<number> = renderManager.runOrSchedule(normalPrioCommand)
  const highPrioCommandResult: Promise<number> = renderManager.runOrSchedule(highPrioCommand)
  for (const command of commandsToBlockQueue) {
    expect(command.promise.isStarted()).toBe(true)
  }
  expect(normalPrioCommand.promise.isStarted()).toBe(false)
  expect(highPrioCommand.promise.isStarted()).toBe(false)

  await Promise.all([normalPrioCommandResult, highPrioCommandResult])

  expect(dom.batch).toBeCalledTimes(1)
  expect(dom.batch).toBeCalledWith([
    {elementId: expect.any(String), method: expect.any(String), value: 'highPrioCommand'},
    {elementId: expect.any(String), method: expect.any(String), value: 'normalPrioCommand'}
  ])
  expect(renderManager.getCommands().length).toBe(0)
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
  const command1 = buildCommand({priority: RenderPriority.NORMAL})
  const command2 = buildCommand({priority: RenderPriority.RESPONSIVE})

  renderManager.addCommand(command1)
  renderManager.addCommand(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toEqual(command2)
  expect(renderManager.getCommands()[1]).toEqual(command1)
})

test('addCommand increasing priority, does not overtake already started command', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({priority: RenderPriority.NORMAL})
  const command2 = buildCommand({priority: RenderPriority.RESPONSIVE})

  renderManager.addCommand(command1)
  command1.promise.run()
  expect(command1.promise.isStarted()).toBe(true)
  renderManager.addCommand(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toEqual(command1)
  expect(renderManager.getCommands()[1]).toEqual(command2)
})

test('addCommand increasing and same priority', () => {
  const renderManager = new RenderManager()
  const command1 = buildCommand({priority: RenderPriority.NORMAL})
  const command2 = buildCommand({priority: RenderPriority.RESPONSIVE})
  const command3 = buildCommand({priority: RenderPriority.RESPONSIVE})

  renderManager.addCommand(command1)
  renderManager.addCommand(command2)
  renderManager.addCommand(command3)

  expect(renderManager.getCommands()).toHaveLength(3)
  expect(renderManager.getCommands()[0]).toEqual(command2)
  expect(renderManager.getCommands()[1]).toEqual(command3)
  expect(renderManager.getCommands()[2]).toEqual(command1)
})

function buildCommand(options: {
  priority?: RenderPriority,
  squashableWith?: string,
  updatableWith?: string,
  batchValue?: string,
  command?: () => Promise<any>
}): Command {
  if (!options.priority) {
    options.priority = RenderPriority.NORMAL
  }
  if (!options.command) {
    options.command = () => Promise.resolve()
  }
  let batchParameters: {elementId: string, method: BatchMethod, value: RenderElements}|undefined = undefined
  if (options.batchValue) {
    batchParameters = {elementId: 'testElementId', method: 'appendChildTo', value: options.batchValue}
  }

  return new Command({
    priority: options.priority,
    squashableWith: options.squashableWith,
    updatableWith: options.updatableWith,
    batchParameters,
    command: options.command
  });
}
