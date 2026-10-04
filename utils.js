import {createRequire} from 'node:module'
const readJSON = createRequire(import.meta.url)

export const require = (data)=>readJSON(data) 