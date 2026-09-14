import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type ElGamal_Ciphertext = { c1: __compactRuntime.JubjubPoint;
                                   c2: __compactRuntime.JubjubPoint
                                 };

export type EcdhMask_Ciphertext = { ephemeralPk: __compactRuntime.JubjubPoint;
                                    ct: bigint
                                  };

export type Witnesses<PS> = {
  wit_ConfidentialTokenSK(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_ConfidentialTokenEK(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_PlaintextBalance(context: __compactRuntime.WitnessContext<Ledger, PS>,
                       ct_0: ElGamal_Ciphertext): [PS, bigint];
  wit_RandomnessSeed(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_OwnableSK(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_ViewingScalar(context: __compactRuntime.WitnessContext<Ledger, PS>,
                    account_0: Uint8Array): [PS, bigint];
  wit_EscrowRandomness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  wit_ViewedBalance(context: __compactRuntime.WitnessContext<Ledger, PS>,
                    ct_0: ElGamal_Ciphertext): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  sweep(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  burn(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       account_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            account_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setPaused(context: __compactRuntime.CircuitContext<PS>, isPaused_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        account_0: Uint8Array,
        to_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  sweep(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  burn(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       account_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            account_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setPaused(context: __compactRuntime.CircuitContext<PS>, isPaused_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        account_0: Uint8Array,
        to_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  computeAccountId(sk_0: Uint8Array): Uint8Array;
  derivePk(ek_0: Uint8Array): __compactRuntime.JubjubPoint;
  viewingScalar(ek_0: Uint8Array): bigint;
  openEscrow(ct_0: EcdhMask_Ciphertext, complianceEk_0: Uint8Array): bigint;
  decryptMemo(memo_0: EcdhMask_Ciphertext, s_0: bigint): bigint;
  decryptToPoint(ct_0: ElGamal_Ciphertext, s_0: bigint): __compactRuntime.JubjubPoint;
  valuePoint(value_0: bigint): __compactRuntime.JubjubPoint;
  addCiphertexts(a_0: ElGamal_Ciphertext, b_0: ElGamal_Ciphertext): ElGamal_Ciphertext;
}

export type Circuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  sweep(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  burn(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       account_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            account_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setPaused(context: __compactRuntime.CircuitContext<PS>, isPaused_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        account_0: Uint8Array,
        to_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  computeAccountId(context: __compactRuntime.CircuitContext<PS>,
                   sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  derivePk(context: __compactRuntime.CircuitContext<PS>, ek_0: Uint8Array): __compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>;
  viewingScalar(context: __compactRuntime.CircuitContext<PS>, ek_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  openEscrow(context: __compactRuntime.CircuitContext<PS>,
             ct_0: EcdhMask_Ciphertext,
             complianceEk_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  decryptMemo(context: __compactRuntime.CircuitContext<PS>,
              memo_0: EcdhMask_Ciphertext,
              s_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  decryptToPoint(context: __compactRuntime.CircuitContext<PS>,
                 ct_0: ElGamal_Ciphertext,
                 s_0: bigint): __compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>;
  valuePoint(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): __compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>;
  addCiphertexts(context: __compactRuntime.CircuitContext<PS>,
                 a_0: ElGamal_Ciphertext,
                 b_0: ElGamal_Ciphertext): __compactRuntime.CircuitResults<PS, ElGamal_Ciphertext>;
}

export type Ledger = {
  CFT__balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): ElGamal_Ciphertext;
    [Symbol.iterator](): Iterator<[Uint8Array, ElGamal_Ciphertext]>
  };
  CFT__pending: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): ElGamal_Ciphertext;
    [Symbol.iterator](): Iterator<[Uint8Array, ElGamal_Ciphertext]>
  };
  CFT__encryptionKeys: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[Uint8Array, __compactRuntime.JubjubPoint]>
  };
  CFT__memos: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      length(): bigint;
      head(): { is_some: boolean, value: EcdhMask_Ciphertext };
      [Symbol.iterator](): Iterator<EcdhMask_Ciphertext>
    }
  };
  readonly CFT__name: string;
  readonly CFT__symbol: string;
  readonly CFT__decimals: bigint;
  readonly Supply__totalSupply: bigint;
  readonly Ownable__owner: { is_left: boolean,
                             left: Uint8Array,
                             right: { bytes: Uint8Array }
                           };
  readonly complianceKey: __compactRuntime.JubjubPoint;
  escrow: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): EcdhMask_Ciphertext;
    [Symbol.iterator](): Iterator<[Uint8Array, EcdhMask_Ciphertext]>
  };
  frozen: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly paused: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               name__0: string,
               symbol__0: string,
               decimals__0: bigint,
               issuer_0: Uint8Array,
               compliancePk_0: __compactRuntime.JubjubPoint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
