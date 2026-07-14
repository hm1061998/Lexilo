export type ConflictChoice='local'|'remote'|'merged';
export function payloadsEqual(a:unknown,b:unknown){return JSON.stringify(sort(a))===JSON.stringify(sort(b));}
function sort(value:unknown):unknown{if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,sort(v)]));return value;}
export function resolveConflict(local:Record<string,unknown>,remote:Record<string,unknown>,choice:ConflictChoice,merged?:Record<string,unknown>){if(payloadsEqual(local,remote))return local;if(choice==='local')return local;if(choice==='remote')return remote;if(!merged)throw new Error('Merged payload is required.');return merged;}
