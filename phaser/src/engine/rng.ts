// Детерминированный RNG — один seed → один экземпляр на клиенте и сервере (ТЗ Часть 6 §6.1)
export class SeededRng {
  private s: number;
  constructor(seed: number){ this.s = seed >>> 0 || 1; }
  next(): number {
    // xorshift32
    let x = this.s;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x >>> 0;
    return (this.s >>> 0) / 4294967296;
  }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next()*arr.length)]; }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(this.next()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  int(min:number,max:number){ return Math.floor(this.next()*(max-min+1))+min; }
}
export function hashString(str:string): number {
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return h>>>0;
}
