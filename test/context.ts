import test from 'ava'
import { IocContext } from '../lib/IocContext'

class TestService {
}

test('default instance.', t => {
  t.true(IocContext.DefaultInstance instanceof IocContext)
})

test('register component error case.', t => {
  enum INJECTTYPE {
    test
  }

  const context = new IocContext
  t.throws(() => context.register(undefined))
  t.throws(() => context.register(123123))
  t.throws(() => context.register({}))
  t.throws(() => context.register({}, 123123 as any))
  t.throws(() => context.register({}, INJECTTYPE.test as any))
  t.throws(() => context.register('33333', undefined, { regInSuperClass: true }))
})

test('register component by class.', t => {
  const context = new IocContext
  context.register(TestService)
  t.true(context.get(TestService) instanceof TestService)
})

test('register component by create function.', t => {
  const context = new IocContext
  context.register(() => {
    t.fail()
  }, 'test', { autoNew: false })
  context.register(() => {
    return { a: 5 }
  }, 'test2')
  t.true(context.get<{ a: number }>('test2').a === 5)
})

test('register component mutli-instance.', t => {
  const context = new IocContext
  context.register(TestService, undefined, { singleton: false })
  const dataA = context.get(TestService)
  t.true(dataA instanceof TestService)
  const dataB = context.get(TestService)
  t.true(dataB instanceof TestService)
  t.false(dataA === dataB)
})

test('register component no autonew.', t => {
  const context = new IocContext
  context.register(TestService, undefined, { autoNew: false })
  const dataA = context.get(TestService)
  t.false(dataA instanceof TestService)
  t.true(dataA === TestService)
})

test('register 2nd with same key.', t => {
  const context = new IocContext
  context.register(TestService)
  t.throws(() => context.register(TestService))
})

test('register component by string.', t => {
  const context = new IocContext
  context.register(TestService, 'string_key')
  t.true(context.get('string_key') instanceof TestService)

  const data = { x: 'test' }
  context.register(data, 'string_key_value')
  t.true(context.get('string_key_value') === data)

  const data2 = 'test_str'
  context.register(data2, 'string_key_value2')
  t.true(context.get('string_key_value2') === data2)
})

test('register not allowed.', t => {
  const context = new IocContext
  t.throws(() => context.register(new TestService))
})

test('auto register component by class.', t => {
  class A { }
  class B {
    @lazyInject()
    a: A
  }
  const context = new IocContext({ autoRegister: true })
  t.true(context.get(B) instanceof B)
  t.true(context.get(B).a instanceof A)
})

test('has component.', t => {
  const context = new IocContext
  context.register(TestService)
  t.true(context.has(TestService))

  class BTest {
  }
  t.false(context.has(BTest))
})

test('remove component.', t => {
  const context = new IocContext
  context.register(TestService)
  t.true(context.get(TestService) instanceof TestService)
  context.remove(TestService)
  t.true(!context.get(TestService))
})

test('replace component.', t => {
  class BClass { }
  const context = new IocContext
  context.register(TestService)
  t.true(context.get(TestService) instanceof TestService)

  context.replace(TestService, BClass)
  t.true(context.get(TestService) instanceof BClass)

  t.throws(() => context.replace(BClass, TestService))

  context.replace(BClass, '123', undefined, true)
  t.true(context.get(BClass) === '123')
})

import { TestService as TS2 } from './base'
test('difference class with same class name.', t => {
  const context = new IocContext
  context.register(TestService)
  context.register(TS2)
  t.true(context.get(TestService) instanceof TestService)
  t.true(context.get(TS2) instanceof TS2)
})

test('subcomponent.', t => {
  class SubClass extends TestService { }

  const context = new IocContext
  context.register(SubClass, TestService)
  t.true(context.get(TestService) instanceof SubClass)
  t.true(context.get(TestService) instanceof TestService)
  t.true(!context.get(SubClass))
})

test('subcomponent? whatever.', t => {
  class SubClass { }

  const context = new IocContext
  context.register(SubClass, TestService)
  t.true(context.get(TestService) instanceof SubClass)
  t.false(context.get(TestService) instanceof TestService)
  t.true(!context.get(SubClass))
})

test('getSubClasses.', t => {
  class AClass { }
  class BClass extends AClass { }
  class CClass extends AClass { }

  const context = new IocContext
  t.true(!context.getSubClasses(AClass))
  context.register(BClass, undefined, { regInSuperClass: true })
  context.register(CClass, undefined, { regInSuperClass: true })
  const cls = context.getSubClasses(AClass)
  t.true(cls.length === 2)
  t.true(cls[0] instanceof BClass)
  t.true(cls[1] instanceof CClass)
  t.false(!context.get(AClass))
})

test('new constructor.', t => {
  let count = 0
  class OtherClass { }
  class AClass {
    @lazyInject()
    other: OtherClass

    constructor() { count++ }
  }
  const context = new IocContext
  context.register(AClass)
  context.register(OtherClass)
  const a = new AClass
  context.inject(a)
  t.true(a.other instanceof OtherClass)
  t.true(count === 1)
})

test('getSubClasses, diff options.', t => {
  class AClass { }
  class BClass extends AClass { }
  class CClass extends AClass { }

  const context = new IocContext
  context.register(BClass, undefined, { regInSuperClass: true })
  context.register(CClass, undefined, { singleton: false, regInSuperClass: true })
  const cls1 = context.getSubClasses(AClass)
  const cls2 = context.getSubClasses(AClass)
  t.true(cls1[0] === cls2[0])
  t.true(cls1[1] !== cls2[1])
})

test('getSubClasses, mutli.', t => {
  class AClass { }
  class BClass extends AClass { }
  class CClass extends BClass { }

  const context = new IocContext
  context.register(CClass, undefined, { regInSuperClass: true })
  t.true(context.getSubClasses(AClass).length === 1)
  t.true(context.getSubClasses(AClass)[0] instanceof AClass)
  t.true(context.getSubClasses(BClass).length === 1)
  t.true(context.getSubClasses(BClass)[0] instanceof BClass)
})

test('getSubClasses, by custom append.', t => {
  const context = new IocContext
  const dataA = { a: 'a' }
  const dataB = { b: 'b' }
  context.append('Test', dataA)
  context.append('Test', dataB)
  const result = context.getSubClasses('Test')
  t.true(result.length === 2)
  t.true(result[0] === dataA)
  t.true(result[1] === dataB)
  t.throws(() => context.append(123 as any, dataA))
})

test('getSubClasses, by custom append, class.', t => {
  class AClass { }

  const context = new IocContext
  context.append('Test', AClass)
  const result = context.getSubClasses('Test')
  t.true(result.length === 1)
  t.true(result[0] instanceof AClass)
  t.true(result[0] === context.get(AClass))
})

test('class init, with ioc instance.', t => {
  class TestService {
    constructor(ioc: IocContext) {
      t.true(ioc instanceof IocContext)
    }
  }

  const context = new IocContext
  context.register(TestService)
  context.get(TestService)
})

import { inject, lazyInject } from '../helper'
test('inject instance.', t => {
  const context = new IocContext

  class AClass {
  }

  class BClass {
    @lazyInject()
    aclass: AClass
    @inject()
    injectclass: AClass
  }

  context.register(AClass)

  const bclass = new BClass
  context.inject(bclass)
  t.true(bclass.aclass instanceof AClass)
  t.true(bclass.injectclass instanceof AClass)
})

test('inject instance, notfound.', t => {
  const context = new IocContext

  class AClass {
  }

  class BClass {
    @lazyInject()
    aclass: AClass
    @inject()
    injectclass: AClass
  }

  const bclass = new BClass
  context.inject(bclass)
  t.true(bclass.aclass === undefined)
  t.true(bclass.injectclass === undefined)
})

import { getGlobalType } from '../utils'
test('inject instance, notfoundhandler.', t => {
  const context = new IocContext

  class AClass {
  }

  class BClass {
    @lazyInject()
    aclass: AClass
    @inject()
    injectclass: AClass
  }

  const bclass = new BClass
  context.inject(bclass, (globalType) => {
    return globalType === getGlobalType(AClass) && new AClass
  })
  t.true(bclass.aclass instanceof AClass)
  t.true(bclass.injectclass instanceof AClass)
})

test('inject instance, string.', t => {
  const context = new IocContext

  context.register({ a: 123 }, 'TEST_A')

  class BClass {
    @lazyInject({ type: 'TEST_A' })
    aclass: { a: number }
  }

  const bclass = new BClass
  context.inject(bclass)
  t.true(bclass.aclass.a === 123)
})


test('lazyInject redefined.', t => {
  const context = new IocContext

  class TestClass {
    a() { return 1 }
  }

  class AClass {
    @lazyInject()
    tClass: TestClass
  }

  class BClass extends AClass {
    @lazyInject()
    tClass: TestClass
  }

  context.register(TestClass)
  context.register(AClass)
  context.register(BClass)

  t.true(context.get(BClass).tClass.a() === 1)
})

test('clear.', t => {
  const context = new IocContext

  class TestClass {
    a() { return 1 }
  }
  context.register(TestClass)
  t.true(context.get(TestClass).a() === 1)

  context.clear()
  t.true(context.get(TestClass) === undefined)
})
