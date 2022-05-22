import { test } from 'tapzero'

import { jams, read } from '../jams.js'

import { readFileSync, readdirSync } from 'fs'

test('passing files and their JSON equivalents', t=> {
    readdirSync('./test/pass').forEach(filename => {
        const extension = filename.split('.').slice(-1)
        if (extension == "jams"){ // only read JAMS, look for json if jams exists
            const jams_o = jams(readFileSync(`./test/pass/${filename}`))
            const jsonfile = readFileSync(`./test/pass/${filename}`.replace('jams', 'json'))
            if (jsonfile) {
                const json_o = JSON.parse(jsonfile)
                for (const key in json_o) {
                    t.ok(jams_o[key])
                    t.ok(obj_equals(json_o[key], jams_o[key]))
                }
            }
        }
    })
})

test('jams', t=>{
    let o = jams('{}')
    t.ok(o)
    t.equal(typeof(o), 'object')
    t.equal(0, Object.keys(o).length)

    o = jams('{key val}')
    t.ok(o)
    t.ok(typeof(o), 'object')
    t.equal(1, Object.keys(o).length)
    t.equal(o['key'], 'val')

    o = jams('{outer {inner val}}')
    t.ok(o)
    t.equal(1, Object.keys(o).length)
    t.equal(o['outer']['inner'], 'val')

    o = jams('{outer {inner val} smushed {inner val2}}')
    t.ok(o)
    t.equal(o['outer']['inner'], 'val')
    t.equal(o['smushed']['inner'], 'val2')

    o = jams('[zero one]')
    t.ok(o)
    t.equal(o[0], 'zero')
    t.equal(o[1], 'one')

    o = jams('[{key val} one]')
    t.ok(o)
    t.equal(o[0]['key'], 'val')
    t.equal(o[1], 'one')

    t.throws(_ => {
        jams('{key val1 key val2}')
    })
    o = jams('{key1 {inner val} key2 {inner val}}')
    t.ok(o)
})

test('strings', t=>{
    let o
    o = jams(`{"key" "val"}`)
    t.equal(o.key, "val")

    o = jams(`{"key" "multi word value"}`)
    t.equal(o.key, "multi word value")

    t.throws(_ => {
        jams`{{bad key} val}`
    })

    t.throws(_ => jams(""))

    o = jams(`{key "val"}`)
    t.equal(o.key, "val")

    o = jams(`{\"key \" val}`)
    t.equal(o[`key `], `val`)

    t.throws(jams(`{\\"key \\" val}`))

    o = jams(`{\key val}`)
    t.equal(o[`\key`], `val`)

    t.throws(_ => jams(`{key" val}`))

    t.throws(_ => jams(`{"key " val\"\}\}}`))
})

test('read', t=>{
    let ast = read(`{}`)
    t.ok(ast)

    ast = read(`{key {key2 val}}`)
    t.ok(ast)

    ast = read(`{ key { key2
val}}`)
    t.ok(ast)
    t.ok(ast.children[0].children)

    ast = read(`[val val]`)
    t.ok(ast)

    ast = read(`{"key space" val}`)
    t.ok(ast)

    ast = read(`{key "val{"}`)
    t.ok(ast)
})


test('casetest sample', t=>{
    let obj = jams(`
{
  note "example casetest jams"
  func adder
  args [1 2]
  want [3 4]
}
    `)
    t.ok(obj)
    t.equal(obj.note, "example casetest jams")
    t.equal(obj.func, "adder")
    t.equal(obj.args.length, 2)
    t.equal(obj.args[0], "1")
    t.equal(obj.args[1], "2")
    t.equal(obj.want.length, 2)
    t.equal(obj.want[0], "3")
    t.equal(obj.want[1], "4")
})

// helper function so that json comparison is cleaner
function obj_equals(ref_obj, contender_obj) {
    if (typeof(ref_obj) == 'string') {
        return ref_obj == contender_obj
    }
    if (Array.isArray(ref_obj)) {
        if (ref_obj.length != contender_obj.length) {
            return false;
        }
        for(let i = 0; i < ref_obj.length; ++i) {
            if (!obj_equals(ref_obj[i], contender_obj[i])) {
                return false;
            }
        }
        return true;
    } 
    for(const key in ref_obj) {
        if (!obj_equals(ref_obj[key], contender_obj[key])) {
            return false;
        }
    }
    return true;
}

