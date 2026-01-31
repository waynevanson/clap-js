import {describe,test,expect} from 'vitest'
import {OurCommand} from '../pkg'

describe('clap-js',() => {
    test('constructor',() => {
        expect(() => new OurCommand('hello')).not.toThrow()
    })
})