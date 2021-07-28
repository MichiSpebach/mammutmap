import { RenderManager, RenderPriority, SchedulablePromise, Command } from '../src/RenderManager'

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

  expect(await command1Result).toBe(1)
  expect(await command2Result).toBe(3)
  expect(await command3Result).toBe(2)
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
  const command1 = buildCommand({})
  const command2 = buildCommand({priority: RenderPriority.NORMAL, squashableWith: 'command'})
  const command3 = buildCommand({priority: RenderPriority.RESPONSIVE, squashableWith: 'command'})

  renderManager.runOrSchedule(command1)
  renderManager.runOrSchedule(command2)
  renderManager.runOrSchedule(command3)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)
  expect(renderManager.getCommands()[1].priority).toBe(RenderPriority.RESPONSIVE)
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

test('runOrSchedule neutralizable, does not neutralize with already started command', () => {
  const renderManager = new RenderManager()
  const commandDirectlyStarted = buildCommand({squashableWith: 'commandPositive', neutralizableWith: 'commandNegative'})
  const command2 = buildCommand({squashableWith: 'commandNegative', neutralizableWith: 'commandPositive'})

  renderManager.runOrSchedule(commandDirectlyStarted)
  renderManager.runOrSchedule(command2)

  expect(renderManager.getCommands()).toHaveLength(2)
  expect(renderManager.getCommands()[0]).toBe(commandDirectlyStarted)
  expect(renderManager.getCommands()[1]).toBe(command2)
})

test('runOrSchedule neutralizable, neutralized commands simply resolve and are not executed', async () => {
  const renderManager = new RenderManager()
  let counter: number = 0
  const command1 = buildCommand({command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command2 = buildCommand({squashableWith: 'commandPositive', neutralizableWith: 'commandNegative', command: () => {
    counter++
    return Promise.resolve(counter)
  }})
  const command3 = buildCommand({squashableWith: 'commandNegative', neutralizableWith: 'commandPositive', command: () => {
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
  expect(await command2Result).toBe(undefined) // promise should resolve to void result
  expect(await command3Result).toBe(undefined) // promise should resolve to void result

  expect(counter).toEqual(1)
})

test('runOrSchedule neutralizable, does not neutralize too much', async () => {
  const renderManager = new RenderManager()
  let command1Executed: boolean = false
  let command2Executed: boolean = false
  let command3Executed: boolean = false
  let command4Executed: boolean = false
  const command1 = buildCommand({command: () => {
    command1Executed = true
    return Promise.resolve()
  }})
  const command2 = buildCommand({squashableWith: 'commandPositive', neutralizableWith: 'commandNegative', command: () => {
    command2Executed = true
    return Promise.resolve()
  }})
  const command3 = buildCommand({squashableWith: 'commandNegative', neutralizableWith: 'commandPositive', command: () => {
    command3Executed = true
    return Promise.resolve()
  }})
  const command4 = buildCommand({squashableWith: 'commandNegative', neutralizableWith: 'commandPositive', command: () => {
    command4Executed = true
    return Promise.resolve()
  }})

  const command1Result: Promise<number> = renderManager.runOrSchedule(command1)
  const command2Result: Promise<number> = renderManager.runOrSchedule(command2)
  const command3Result: Promise<number> = renderManager.runOrSchedule(command3)
  const command4Result: Promise<number> = renderManager.runOrSchedule(command4)

  expect(renderManager.getCommands()).toHaveLength(3)
  expect(renderManager.getCommands()[0]).toBe(command1)
  expect(renderManager.getCommands()[1]).toBe(command2)
  expect(renderManager.getCommands()[2]).toBe(command4)

  await Promise.all([command1Result, command2Result, command3Result, command4Result])

  expect(command1Executed).toEqual(true)
  expect(command2Executed).toEqual(false)
  expect(command3Executed).toEqual(false)
  expect(command4Executed).toEqual(true)
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
  neutralizableWith?: string,
  command?: () => Promise<any>
}): Command {
  if (!options.priority) {
    options.priority = RenderPriority.NORMAL
  }
  if (!options.command) {
    options.command = () => Promise.resolve()
  }

  return new Command({
    priority: options.priority,
    squashableWith: options.squashableWith,
    neutralizableWith: options.neutralizableWith,
    command: options.command
  });
}
