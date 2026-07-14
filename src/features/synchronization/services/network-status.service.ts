import NetInfo from '@react-native-community/netinfo';
export interface NetworkSnapshot{connected:boolean;reachable:boolean;expensive:boolean}
export class NetworkStatusService{async get():Promise<NetworkSnapshot>{const s=await NetInfo.fetch();return{connected:s.isConnected===true,reachable:s.isInternetReachable!==false,expensive:Boolean(s.details?.isConnectionExpensive)}}subscribe(listener:(s:NetworkSnapshot)=>void){return NetInfo.addEventListener(s=>listener({connected:s.isConnected===true,reachable:s.isInternetReachable!==false,expensive:Boolean(s.details?.isConnectionExpensive)}))}}
