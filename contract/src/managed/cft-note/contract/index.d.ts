import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Note = { value: bigint; nonce: bigint };

export type AuditRecord = { ephemeralPk: __compactRuntime.JubjubPoint;
                            valueCt: bigint;
                            ownerCt: bigint
                          };

export type AuditView = { value: bigint; nonce: bigint; ownerPk: bigint };

export type FullDelivery = { ephemeral: __compactRuntime.JubjubPoint;
                             valueCt: bigint;
                             nonceCt: bigint
                           };

export type NoteDelivery_Recovered = { value: bigint; nonce: bigint };

export type Witnesses<PS> = {
  wit_SecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_InputNote(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Note];
  wit_Path(context: __compactRuntime.WitnessContext<Ledger, PS>,
           cm_0: Uint8Array): [PS, { leaf: Uint8Array,
                                     path: { sibling: { field: bigint },
                                             goes_left: boolean
                                           }[]
                                   }];
  wit_IssuerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_AuthoritySecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_AuditRandomness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_DeliveryRandomness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_SupplyRandomness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  mint(context: __compactRuntime.CircuitContext<PS>,
       recipientPk_0: bigint,
       recipientEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           recipientPk_0: bigint,
           recipientEncPk_0: __compactRuntime.JubjubPoint,
           senderEncPk_0: __compactRuntime.JubjubPoint,
           value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       senderEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        targetOwnerPk_0: bigint,
        recoveryPk_0: bigint,
        recoveryEncPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            nf_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  mint(context: __compactRuntime.CircuitContext<PS>,
       recipientPk_0: bigint,
       recipientEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           recipientPk_0: bigint,
           recipientEncPk_0: __compactRuntime.JubjubPoint,
           senderEncPk_0: __compactRuntime.JubjubPoint,
           value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       senderEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        targetOwnerPk_0: bigint,
        recoveryPk_0: bigint,
        recoveryEncPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            nf_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  derivePk(sk_0: Uint8Array): bigint;
  encPkOf(encSk_0: bigint): __compactRuntime.JubjubPoint;
  commitOf(note_0: Note, pk_0: bigint): Uint8Array;
  nullifierOf(note_0: Note): Uint8Array;
  recoverNote(delivery_0: FullDelivery, encSk_0: bigint): NoteDelivery_Recovered;
  recoverAuditRecord(record_0: AuditRecord, auditSk_0: bigint): AuditView;
}

export type Circuits<PS> = {
  mint(context: __compactRuntime.CircuitContext<PS>,
       recipientPk_0: bigint,
       recipientEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           recipientPk_0: bigint,
           recipientEncPk_0: __compactRuntime.JubjubPoint,
           senderEncPk_0: __compactRuntime.JubjubPoint,
           value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       senderEncPk_0: __compactRuntime.JubjubPoint,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  seize(context: __compactRuntime.CircuitContext<PS>,
        targetOwnerPk_0: bigint,
        recoveryPk_0: bigint,
        recoveryEncPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  setFrozen(context: __compactRuntime.CircuitContext<PS>,
            nf_0: Uint8Array,
            isFrozen_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  derivePk(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  encPkOf(context: __compactRuntime.CircuitContext<PS>, encSk_0: bigint): __compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>;
  commitOf(context: __compactRuntime.CircuitContext<PS>,
           note_0: Note,
           pk_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  nullifierOf(context: __compactRuntime.CircuitContext<PS>, note_0: Note): __compactRuntime.CircuitResults<PS, Uint8Array>;
  recoverNote(context: __compactRuntime.CircuitContext<PS>,
              delivery_0: FullDelivery,
              encSk_0: bigint): __compactRuntime.CircuitResults<PS, NoteDelivery_Recovered>;
  recoverAuditRecord(context: __compactRuntime.CircuitContext<PS>,
                     record_0: AuditRecord,
                     auditSk_0: bigint): __compactRuntime.CircuitResults<PS, AuditView>;
}

export type Ledger = {
  readonly _seizureCount: bigint;
  _commitments: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  _nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly _issuerPk: bigint;
  readonly _authorityPk: bigint;
  readonly _auditKey: __compactRuntime.JubjubPoint;
  _auditTrail: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: AuditRecord };
    [Symbol.iterator](): Iterator<AuditRecord>
  };
  _deliveries: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: FullDelivery };
    [Symbol.iterator](): Iterator<FullDelivery>
  };
  readonly _supplyKey: __compactRuntime.JubjubPoint;
  readonly _encSupply: { c1: __compactRuntime.JubjubPoint,
                         c2: __compactRuntime.JubjubPoint
                       };
  _frozen: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
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
               issuerPk_0: bigint,
               authorityPk_0: bigint,
               auditKey_0: __compactRuntime.JubjubPoint,
               supplyKey_0: __compactRuntime.JubjubPoint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
