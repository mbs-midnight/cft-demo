import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = __compactRuntime.CompactTypeJubjubPoint;

const _descriptor_1 = __compactRuntime.CompactTypeField;

class _FullDelivery_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      ephemeral: _descriptor_0.fromValue(value_0),
      valueCt: _descriptor_1.fromValue(value_0),
      nonceCt: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.ephemeral).concat(_descriptor_1.toValue(value_0.valueCt).concat(_descriptor_1.toValue(value_0.nonceCt)));
  }
}

const _descriptor_2 = new _FullDelivery_0();

class _Recovered_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      value: _descriptor_1.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.value).concat(_descriptor_1.toValue(value_0.nonce));
  }
}

const _descriptor_3 = new _Recovered_0();

class _AuditRecord_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      ephemeralPk: _descriptor_0.fromValue(value_0),
      valueCt: _descriptor_1.fromValue(value_0),
      ownerCt: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.ephemeralPk).concat(_descriptor_1.toValue(value_0.valueCt).concat(_descriptor_1.toValue(value_0.ownerCt)));
  }
}

const _descriptor_4 = new _AuditRecord_0();

class _AuditView_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      value: _descriptor_1.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0),
      ownerPk: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.value).concat(_descriptor_1.toValue(value_0.nonce).concat(_descriptor_1.toValue(value_0.ownerPk)));
  }
}

const _descriptor_5 = new _AuditView_0();

const _descriptor_6 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _Note_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      value: _descriptor_6.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.value).concat(_descriptor_1.toValue(value_0.nonce));
  }
}

const _descriptor_7 = new _Note_0();

const _descriptor_8 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_9 = __compactRuntime.CompactTypeBoolean;

class _Ciphertext_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return {
      c1: _descriptor_0.fromValue(value_0),
      c2: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.c1).concat(_descriptor_0.toValue(value_0.c2));
  }
}

const _descriptor_10 = new _Ciphertext_0();

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.field);
  }
}

const _descriptor_11 = new _MerkleTreeDigest_0();

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_11.alignment().concat(_descriptor_9.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_11.fromValue(value_0),
      goes_left: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_11.toValue(value_0.sibling).concat(_descriptor_9.toValue(value_0.goes_left));
  }
}

const _descriptor_12 = new _MerkleTreePathEntry_0();

const _descriptor_13 = new __compactRuntime.CompactTypeVector(32, _descriptor_12);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_8.fromValue(value_0),
      path: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.leaf).concat(_descriptor_13.toValue(value_0.path));
  }
}

const _descriptor_14 = new _MerkleTreePath_0();

const _descriptor_15 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_16 = new __compactRuntime.CompactTypeVector(2, _descriptor_8);

class _NullifierPreimage_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      domain: _descriptor_8.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.domain).concat(_descriptor_1.toValue(value_0.nonce));
  }
}

const _descriptor_17 = new _NullifierPreimage_0();

class _CommitPreimage_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_6.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment())));
  }
  fromValue(value_0) {
    return {
      domain: _descriptor_8.fromValue(value_0),
      value: _descriptor_6.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0),
      pk: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.domain).concat(_descriptor_6.toValue(value_0.value).concat(_descriptor_1.toValue(value_0.nonce).concat(_descriptor_1.toValue(value_0.pk))));
  }
}

const _descriptor_18 = new _CommitPreimage_0();

const _descriptor_19 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_19.alignment().concat(_descriptor_8.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_19.fromValue(value_0),
      data: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_19.toValue(value_0.domain_sep).concat(_descriptor_8.toValue(value_0.data));
  }
}

const _descriptor_20 = new _LeafPreimage_0();

const _descriptor_21 = new __compactRuntime.CompactTypeVector(3, _descriptor_8);

const _descriptor_22 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

class _Either_0 {
  alignment() {
    return _descriptor_9.alignment().concat(_descriptor_8.alignment().concat(_descriptor_8.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_9.fromValue(value_0),
      left: _descriptor_8.fromValue(value_0),
      right: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0.is_left).concat(_descriptor_8.toValue(value_0.left).concat(_descriptor_8.toValue(value_0.right)));
  }
}

const _descriptor_23 = new _Either_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_8.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.bytes);
  }
}

const _descriptor_24 = new _ContractAddress_0();

class _Maybe_0 {
  alignment() {
    return _descriptor_9.alignment().concat(_descriptor_4.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_9.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0.is_some).concat(_descriptor_4.toValue(value_0.value));
  }
}

const _descriptor_25 = new _Maybe_0();

class _Maybe_1 {
  alignment() {
    return _descriptor_9.alignment().concat(_descriptor_2.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_9.fromValue(value_0),
      value: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0.is_some).concat(_descriptor_2.toValue(value_0.value));
  }
}

const _descriptor_26 = new _Maybe_1();

const _descriptor_27 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.wit_SecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_SecretKey');
    }
    if (typeof(witnesses_0.wit_InputNote) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_InputNote');
    }
    if (typeof(witnesses_0.wit_Path) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_Path');
    }
    if (typeof(witnesses_0.wit_IssuerSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_IssuerSecret');
    }
    if (typeof(witnesses_0.wit_AuthoritySecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_AuthoritySecret');
    }
    if (typeof(witnesses_0.wit_AuditRandomness) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_AuditRandomness');
    }
    if (typeof(witnesses_0.wit_DeliveryRandomness) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_DeliveryRandomness');
    }
    if (typeof(witnesses_0.wit_SupplyRandomness) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_SupplyRandomness');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      mint: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`mint: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const recipientPk_0 = args_1[1];
        const recipientEncPk_0 = args_1[2];
        const value_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mint',
                                     'argument 1 (as invoked from Typescript)',
                                     'cft-note.compact line 90 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(recipientPk_0) === 'bigint' && recipientPk_0 >= 0 && recipientPk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('mint',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cft-note.compact line 90 char 1',
                                     'Field',
                                     recipientPk_0)
        }
        if (!(typeof(value_0) === 'bigint' && value_0 >= 0n && value_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('mint',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cft-note.compact line 90 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     value_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(recipientPk_0).concat(_descriptor_0.toValue(recipientEncPk_0).concat(_descriptor_6.toValue(value_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_6.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mint_1(context,
                                      partialProofData,
                                      recipientPk_0,
                                      recipientEncPk_0,
                                      value_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      transfer: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`transfer: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const recipientPk_0 = args_1[1];
        const recipientEncPk_0 = args_1[2];
        const senderEncPk_0 = args_1[3];
        const value_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('transfer',
                                     'argument 1 (as invoked from Typescript)',
                                     'cft-note.compact line 98 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(recipientPk_0) === 'bigint' && recipientPk_0 >= 0 && recipientPk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('transfer',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cft-note.compact line 98 char 1',
                                     'Field',
                                     recipientPk_0)
        }
        if (!(typeof(value_0) === 'bigint' && value_0 >= 0n && value_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('transfer',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cft-note.compact line 98 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     value_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(recipientPk_0).concat(_descriptor_0.toValue(recipientEncPk_0).concat(_descriptor_0.toValue(senderEncPk_0).concat(_descriptor_6.toValue(value_0)))),
            alignment: _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_6.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._transfer_1(context,
                                          partialProofData,
                                          recipientPk_0,
                                          recipientEncPk_0,
                                          senderEncPk_0,
                                          value_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      burn: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`burn: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const senderEncPk_0 = args_1[1];
        const value_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('burn',
                                     'argument 1 (as invoked from Typescript)',
                                     'cft-note.compact line 108 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(value_0) === 'bigint' && value_0 >= 0n && value_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('burn',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cft-note.compact line 108 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     value_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(senderEncPk_0).concat(_descriptor_6.toValue(value_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_6.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._burn_1(context,
                                      partialProofData,
                                      senderEncPk_0,
                                      value_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      seize: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`seize: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const targetOwnerPk_0 = args_1[1];
        const recoveryPk_0 = args_1[2];
        const recoveryEncPk_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('seize',
                                     'argument 1 (as invoked from Typescript)',
                                     'cft-note.compact line 119 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(targetOwnerPk_0) === 'bigint' && targetOwnerPk_0 >= 0 && targetOwnerPk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('seize',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cft-note.compact line 119 char 1',
                                     'Field',
                                     targetOwnerPk_0)
        }
        if (!(typeof(recoveryPk_0) === 'bigint' && recoveryPk_0 >= 0 && recoveryPk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('seize',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cft-note.compact line 119 char 1',
                                     'Field',
                                     recoveryPk_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(targetOwnerPk_0).concat(_descriptor_1.toValue(recoveryPk_0).concat(_descriptor_0.toValue(recoveryEncPk_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._seize_1(context,
                                       partialProofData,
                                       targetOwnerPk_0,
                                       recoveryPk_0,
                                       recoveryEncPk_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      setFrozen: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`setFrozen: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const nf_0 = args_1[1];
        const isFrozen_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('setFrozen',
                                     'argument 1 (as invoked from Typescript)',
                                     'cft-note.compact line 124 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(nf_0.buffer instanceof ArrayBuffer && nf_0.BYTES_PER_ELEMENT === 1 && nf_0.length === 32)) {
          __compactRuntime.typeError('setFrozen',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cft-note.compact line 124 char 1',
                                     'Bytes<32>',
                                     nf_0)
        }
        if (!(typeof(isFrozen_0) === 'boolean')) {
          __compactRuntime.typeError('setFrozen',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cft-note.compact line 124 char 1',
                                     'Boolean',
                                     isFrozen_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_8.toValue(nf_0).concat(_descriptor_9.toValue(isFrozen_0)),
            alignment: _descriptor_8.alignment().concat(_descriptor_9.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._setFrozen_0(context,
                                           partialProofData,
                                           nf_0,
                                           isFrozen_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      derivePk(context, ...args_1) {
        return { result: pureCircuits.derivePk(...args_1), context };
      },
      encPkOf(context, ...args_1) {
        return { result: pureCircuits.encPkOf(...args_1), context };
      },
      commitOf(context, ...args_1) {
        return { result: pureCircuits.commitOf(...args_1), context };
      },
      nullifierOf(context, ...args_1) {
        return { result: pureCircuits.nullifierOf(...args_1), context };
      },
      recoverNote(context, ...args_1) {
        return { result: pureCircuits.recoverNote(...args_1), context };
      },
      recoverAuditRecord(context, ...args_1) {
        return { result: pureCircuits.recoverAuditRecord(...args_1), context };
      }
    };
    this.impureCircuits = {
      mint: this.circuits.mint,
      transfer: this.circuits.transfer,
      burn: this.circuits.burn,
      seize: this.circuits.seize,
      setFrozen: this.circuits.setFrozen
    };
    this.provableCircuits = {
      mint: this.circuits.mint,
      transfer: this.circuits.transfer,
      burn: this.circuits.burn,
      seize: this.circuits.seize,
      setFrozen: this.circuits.setFrozen
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 5) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 5 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const issuerPk_0 = args_0[1];
    const authorityPk_0 = args_0[2];
    const auditKey_0 = args_0[3];
    const supplyKey_0 = args_0[4];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(issuerPk_0) === 'bigint' && issuerPk_0 >= 0 && issuerPk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'cft-note.compact line 78 char 1',
                                 'Field',
                                 issuerPk_0)
    }
    if (!(typeof(authorityPk_0) === 'bigint' && authorityPk_0 >= 0 && authorityPk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'cft-note.compact line 78 char 1',
                                 'Field',
                                 authorityPk_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    let stateValue_2 = __compactRuntime.StateValue.newArray();
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_2);
    let stateValue_1 = __compactRuntime.StateValue.newArray();
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_1);
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('mint', new __compactRuntime.ContractOperation());
    state_0.setOperation('transfer', new __compactRuntime.ContractOperation());
    state_0.setOperation('burn', new __compactRuntime.ContractOperation());
    state_0.setOperation('seize', new __compactRuntime.ContractOperation());
    state_0.setOperation('setFrozen', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(32)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                        alignment: _descriptor_15.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                              new __compactRuntime.StateMap()
                                                                                                                                                                            ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(3n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(4n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(5n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(7n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                                                                                                             alignment: _descriptor_15.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(3n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                                                                                                             alignment: _descriptor_15.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(4n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(5n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue({ c1: ({x: 0n, y: 1n}), c2: ({x: 0n, y: 1n}) }),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(7n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(8n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(9n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(10n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(32)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                        alignment: _descriptor_15.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                              new __compactRuntime.StateMap()
                                                                                                                                                                            ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(11n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(12n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(false),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(13n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(14n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                                                                                                             alignment: _descriptor_15.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    this._initialize_0(context,
                       partialProofData,
                       issuerPk_0,
                       authorityPk_0,
                       auditKey_0,
                       supplyKey_0);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_0({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_0([left_0, right_0]);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_22, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_20, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_21, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_18, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_17, value_0);
    return result_0;
  }
  _persistentHash_5(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_0, value_0);
    return result_0;
  }
  _persistentHash_6(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_16, value_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _initialize_0(context,
                partialProofData,
                issuerPk_0,
                authorityPk_0,
                auditKey_0,
                supplyKey_0)
  {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'RegulatedConfidentialNoteFungibleToken: already initialized');
    this._initialize_1(context, partialProofData, issuerPk_0);
    this._initialize_2(context, partialProofData, authorityPk_0);
    this._initialize_3(context, partialProofData, auditKey_0);
    this._initialize_4(context, partialProofData, supplyKey_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(true),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _mint_0(context, partialProofData, recipientPk_0, recipientEncPk_0, value_0) {
    this.__assertIssuer_0(context, partialProofData);
    const note_0 = this._emitOutput_0(context,
                                      partialProofData,
                                      recipientPk_0,
                                      recipientEncPk_0,
                                      value_0,
                                      new Uint8Array([79, 90, 58, 99, 110, 116, 58, 111, 117, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    this.__mintNote_0(context, partialProofData, note_0, recipientPk_0);
    this.__addMinted_0(context, partialProofData, value_0);
    return [];
  }
  _transfer_0(context,
              partialProofData,
              recipientPk_0,
              recipientEncPk_0,
              senderEncPk_0,
              value_0)
  {
    const pk_0 = this.__spenderPk_0(context, partialProofData);
    const input_0 = this.__inputNote_0(context, partialProofData);
    this.__assertNotFrozen_0(context,
                             partialProofData,
                             this._nullifierOf_0(input_0));
    let t_0;
    __compactRuntime.assert((t_0 = input_0.value, t_0 >= value_0),
                            'RegulatedConfidentialNoteFungibleToken: insufficient note value');
    let t_1;
    const changeValue_0 = (t_1 = input_0.value,
                           (__compactRuntime.assert(t_1 >= value_0,
                                                    'result of subtraction would be negative'),
                            t_1 - value_0));
    const outNote_0 = this._emitOutput_0(context,
                                         partialProofData,
                                         recipientPk_0,
                                         recipientEncPk_0,
                                         value_0,
                                         new Uint8Array([79, 90, 58, 99, 110, 116, 58, 111, 117, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const changeNote_0 = this._emitOutput_0(context,
                                            partialProofData,
                                            pk_0,
                                            senderEncPk_0,
                                            changeValue_0,
                                            new Uint8Array([79, 90, 58, 99, 110, 116, 58, 99, 104, 103, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    this.__transfer_0(context,
                      partialProofData,
                      pk_0,
                      recipientPk_0,
                      outNote_0,
                      changeNote_0);
    return [];
  }
  _burn_0(context, partialProofData, senderEncPk_0, value_0) {
    const pk_0 = this.__spenderPk_0(context, partialProofData);
    const input_0 = this.__inputNote_0(context, partialProofData);
    this.__assertNotFrozen_0(context,
                             partialProofData,
                             this._nullifierOf_0(input_0));
    let t_0;
    __compactRuntime.assert((t_0 = input_0.value, t_0 >= value_0),
                            'RegulatedConfidentialNoteFungibleToken: insufficient note value');
    let t_1;
    const changeValue_0 = (t_1 = input_0.value,
                           (__compactRuntime.assert(t_1 >= value_0,
                                                    'result of subtraction would be negative'),
                            t_1 - value_0));
    const changeNote_0 = this._emitOutput_0(context,
                                            partialProofData,
                                            pk_0,
                                            senderEncPk_0,
                                            changeValue_0,
                                            new Uint8Array([79, 90, 58, 99, 110, 116, 58, 99, 104, 103, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    this.__burn_0(context, partialProofData, pk_0, value_0, changeNote_0);
    this.__addBurned_0(context, partialProofData, value_0);
    return [];
  }
  _seize_0(context,
           partialProofData,
           targetOwnerPk_0,
           recoveryPk_0,
           recoveryEncPk_0)
  {
    this.__assertAuthority_0(context, partialProofData);
    const target_0 = this.__consumeNote_0(context,
                                          partialProofData,
                                          targetOwnerPk_0);
    const recoveryNote_0 = this._emitOutput_0(context,
                                              partialProofData,
                                              recoveryPk_0,
                                              recoveryEncPk_0,
                                              target_0.value,
                                              new Uint8Array([79, 90, 58, 99, 110, 116, 58, 111, 117, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    this.__mintNote_0(context, partialProofData, recoveryNote_0, recoveryPk_0);
    const tmp_0 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('RegulatedConfidentialNoteFungibleToken.compact line 283 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(_descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_27.toValue(0n),
                                                                                                            alignment: _descriptor_27.alignment() } },
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_27.toValue(1n),
                                                                                                            alignment: _descriptor_27.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value)
                     +
                     1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(tmp_0),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _freeze_0(context, partialProofData, nf_0) {
    this.__assertAuthority_0(context, partialProofData);
    this.__freeze_0(context, partialProofData, nf_0);
    return [];
  }
  _unfreeze_0(context, partialProofData, nf_0) {
    this.__assertAuthority_0(context, partialProofData);
    this.__unfreeze_0(context, partialProofData, nf_0);
    return [];
  }
  _emitOutput_0(context, partialProofData, ownerPk_0, encPk_0, value_0, slot_0)
  {
    const nonce_0 = this.__emitAuditedOutput_0(context,
                                               partialProofData,
                                               ownerPk_0,
                                               value_0,
                                               slot_0);
    this.__deliver_0(context,
                     partialProofData,
                     encPk_0,
                     value_0,
                     nonce_0,
                     slot_0);
    return { value: value_0, nonce: nonce_0 };
  }
  _wit_SecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_SecretKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_SecretKey',
                                 'return value',
                                 'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 80 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _wit_InputNote_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_InputNote(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && typeof(result_0.value) === 'bigint' && result_0.value >= 0n && result_0.value <= 340282366920938463463374607431768211455n && typeof(result_0.nonce) === 'bigint' && result_0.nonce >= 0 && result_0.nonce <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('wit_InputNote',
                                 'return value',
                                 'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 82 char 3',
                                 'struct Note<value: Uint<0..340282366920938463463374607431768211456>, nonce: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  _wit_Path_0(context, partialProofData, cm_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_Path(witnessContext_0,
                                                                   cm_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 32 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('wit_Path',
                                 'return value',
                                 'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 83 char 3',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<32, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_14.toValue(result_0),
      alignment: _descriptor_14.alignment()
    });
    return result_0;
  }
  _derivePk_0(sk_0) {
    return this._degradeToTransient_0(this._persistentHash_2(sk_0));
  }
  _commitOf_0(note_0, pk_0) {
    return this._persistentHash_3({ domain:
                                      new Uint8Array([79, 90, 58, 99, 110, 116, 58, 99, 111, 109, 109, 105, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    value: note_0.value,
                                    nonce: note_0.nonce,
                                    pk: pk_0 });
  }
  _nullifierOf_0(note_0) {
    return this._persistentHash_4({ domain:
                                      new Uint8Array([79, 90, 58, 99, 110, 116, 58, 110, 117, 108, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    nonce: note_0.nonce });
  }
  __spenderPk_0(context, partialProofData) {
    return this._derivePk_0(this._wit_SecretKey_0(context, partialProofData));
  }
  __inputNote_0(context, partialProofData) {
    return this._wit_InputNote_0(context, partialProofData);
  }
  __mintNote_0(context, partialProofData, note_0, ownerPk_0) {
    const tmp_0 = this._commitOf_0(note_0, ownerPk_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_8.toValue(tmp_0),
                                                                                                alignment: _descriptor_8.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 3 } }]);
    return [];
  }
  __transfer_0(context,
               partialProofData,
               spenderPk_0,
               recipientPk_0,
               outNote_0,
               changeNote_0)
  {
    const input_0 = this.__consumeNote_0(context, partialProofData, spenderPk_0);
    __compactRuntime.assert(this._equal_0(input_0.value,
                                          outNote_0.value + changeNote_0.value),
                            'ConfidentialNoteFungibleToken: transfer does not conserve value');
    this.__mintNote_0(context, partialProofData, outNote_0, recipientPk_0);
    this.__mintNote_0(context, partialProofData, changeNote_0, spenderPk_0);
    return [];
  }
  __burn_0(context, partialProofData, spenderPk_0, value_0, changeNote_0) {
    const input_0 = this.__consumeNote_0(context, partialProofData, spenderPk_0);
    __compactRuntime.assert(this._equal_1(input_0.value,
                                          value_0 + changeNote_0.value),
                            'ConfidentialNoteFungibleToken: burn does not conserve value');
    this.__mintNote_0(context, partialProofData, changeNote_0, spenderPk_0);
    return [];
  }
  __consumeNote_0(context, partialProofData, ownerPk_0) {
    const input_0 = this._wit_InputNote_0(context, partialProofData);
    const cm_0 = this._commitOf_0(input_0, ownerPk_0);
    const path_0 = this._wit_Path_0(context, partialProofData, cm_0);
    const root_0 = this._merkleTreePathRoot_0(path_0);
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(2n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(2n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(root_0),
                                                                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleToken: input root not recognized');
    __compactRuntime.assert(this._equal_2(cm_0, path_0.leaf),
                            'ConfidentialNoteFungibleToken: path does not match input commitment');
    const nf_0 = this._nullifierOf_0(input_0);
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(3n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                                                                               alignment: _descriptor_8.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleToken: note already spent');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(3n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return input_0;
  }
  _wit_IssuerSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_IssuerSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_IssuerSecret',
                                 'return value',
                                 'ConfidentialNoteFungibleTokenIssuer.compact line 42 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _initialize_1(context, partialProofData, issuerPk_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(4n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenIssuer: already initialized');
    __compactRuntime.assert(issuerPk_0 !== 0n,
                            'ConfidentialNoteFungibleTokenIssuer: zero issuer key');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(5n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(issuerPk_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(4n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(true),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  __assertIssuer_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(4n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenIssuer: extension not initialized');
    __compactRuntime.assert(this._derivePk_1(this._wit_IssuerSecret_0(context,
                                                                      partialProofData))
                            ===
                            _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(5n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenIssuer: not the issuer');
    return [];
  }
  _derivePk_1(sk_0) {
    return this._degradeToTransient_0(this._persistentHash_2(sk_0));
  }
  _wit_AuthoritySecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_AuthoritySecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_AuthoritySecret',
                                 'return value',
                                 'ConfidentialNoteFungibleTokenAuthority.compact line 42 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _initialize_2(context, partialProofData, authorityPk_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(6n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenAuthority: already initialized');
    __compactRuntime.assert(authorityPk_0 !== 0n,
                            'ConfidentialNoteFungibleTokenAuthority: zero authority key');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(7n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(authorityPk_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(true),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  __assertAuthority_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(6n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenAuthority: extension not initialized');
    __compactRuntime.assert(this._derivePk_2(this._wit_AuthoritySecret_0(context,
                                                                         partialProofData))
                            ===
                            _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(7n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenAuthority: not the authority');
    return [];
  }
  _derivePk_2(sk_0) {
    return this._degradeToTransient_0(this._persistentHash_2(sk_0));
  }
  _wit_AuditRandomness_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_AuditRandomness(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_AuditRandomness',
                                 'return value',
                                 'src/./oz-note/token/presets/../extensions/ConfidentialNoteFungibleTokenAudit.compact line 78 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _initialize_3(context, partialProofData, auditKey_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenAudit: already initialized');
    __compactRuntime.assert(!this._equal_3(auditKey_0,
                                           this._ecMulGenerator_0(0n)),
                            'ConfidentialNoteFungibleTokenAudit: identity audit key');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(auditKey_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(true),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  __emitAuditedOutput_0(context, partialProofData, ownerPk_0, value_0, slot_0) {
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(1n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(0n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenAudit: extension not initialized');
    const ea_0 = this._degradeToTransient_0(this._persistentHash_1([this._wit_AuditRandomness_0(context,
                                                                                                partialProofData),
                                                                    new Uint8Array([79, 90, 58, 99, 110, 116, 58, 101, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                    slot_0]));
    const eaPk_0 = this._ecMulGenerator_0(ea_0);
    __compactRuntime.assert(!this._equal_4(eaPk_0, this._ecMulGenerator_0(0n)),
                            'ConfidentialNoteFungibleTokenAudit: zero audit ephemeral');
    const shared_0 = this._ecMul_0(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                             partialProofData,
                                                                                             [
                                                                                              { dup: { n: 0 } },
                                                                                              { idx: { cached: false,
                                                                                                       pushPath: false,
                                                                                                       path: [
                                                                                                              { tag: 'value',
                                                                                                                value: { value: _descriptor_27.toValue(1n),
                                                                                                                         alignment: _descriptor_27.alignment() } },
                                                                                                              { tag: 'value',
                                                                                                                value: { value: _descriptor_27.toValue(1n),
                                                                                                                         alignment: _descriptor_27.alignment() } }] } },
                                                                                              { popeq: { cached: false,
                                                                                                         result: undefined } }]).value),
                                   ea_0);
    const nonce_0 = this._kdf_0(shared_0,
                                new Uint8Array([79, 90, 58, 99, 110, 116, 58, 110, 111, 110, 99, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const tmp_0 = { ephemeralPk: eaPk_0,
                    valueCt:
                      __compactRuntime.addField(value_0,
                                                this._kdf_0(shared_0,
                                                            new Uint8Array([79, 90, 58, 99, 110, 116, 58, 97, 58, 118, 97, 108, 117, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))),
                    ownerCt:
                      __compactRuntime.addField(ownerPk_0,
                                                this._kdf_0(shared_0,
                                                            new Uint8Array([79, 90, 58, 99, 110, 116, 58, 97, 58, 111, 119, 110, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 0 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                                           alignment: _descriptor_4.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                                          .encode() } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 1 } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 3 } }]);
    return nonce_0;
  }
  _kdf_0(sShared_0, domain_0) {
    const pointHash_0 = this._persistentHash_5(sShared_0);
    return this._degradeToTransient_0(this._persistentHash_6([pointHash_0,
                                                              domain_0]));
  }
  _wit_DeliveryRandomness_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_DeliveryRandomness(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_DeliveryRandomness',
                                 'return value',
                                 'ConfidentialNoteFungibleTokenDelivery.compact line 45 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  __deliver_0(context, partialProofData, encPk_0, value_0, nonce_0, slot_0) {
    const ed_0 = this._degradeToTransient_0(this._persistentHash_1([this._wit_DeliveryRandomness_0(context,
                                                                                                   partialProofData),
                                                                    new Uint8Array([79, 90, 58, 99, 110, 116, 58, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                    slot_0]));
    const tmp_0 = this._deliverNote_0(encPk_0,
                                      { value: value_0, nonce: nonce_0 },
                                      ed_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(3n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 0 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                           alignment: _descriptor_2.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                                          .encode() } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 1 } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 3 } }]);
    return [];
  }
  _kdf_1(shared_0, domain_0) {
    return this._degradeToTransient_0(this._persistentHash_6([this._persistentHash_5(shared_0),
                                                              domain_0]));
  }
  _deliverNote_0(recipientEncPk_0, note_0, e_0) {
    const identity_0 = this._ecMulGenerator_0(0n);
    __compactRuntime.assert(!this._equal_5(recipientEncPk_0, identity_0),
                            'NoteDelivery: identity pk');
    const ephemeral_0 = this._ecMulGenerator_0(e_0);
    __compactRuntime.assert(!this._equal_6(ephemeral_0, identity_0),
                            'NoteDelivery: zero ephemeral');
    const shared_0 = this._ecMul_0(recipientEncPk_0, e_0);
    return { ephemeral: ephemeral_0,
             valueCt:
               __compactRuntime.addField(note_0.value,
                                         this._kdf_1(shared_0,
                                                     new Uint8Array([110, 111, 116, 101, 58, 118, 97, 108, 117, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))),
             nonceCt:
               __compactRuntime.addField(note_0.nonce,
                                         this._kdf_1(shared_0,
                                                     new Uint8Array([110, 111, 116, 101, 58, 110, 111, 110, 99, 101, 58, 99, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))) };
  }
  _wit_SupplyRandomness_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_SupplyRandomness(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_SupplyRandomness',
                                 'return value',
                                 'ConfidentialNoteFungibleTokenPrivateSupply.compact line 76 char 3',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _initialize_4(context, partialProofData, supplyKey_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(4n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenPrivateSupply: already initialized');
    __compactRuntime.assert(!this._equal_7(supplyKey_0,
                                           this._ecMulGenerator_0(0n)),
                            'ConfidentialNoteFungibleTokenPrivateSupply: identity supply key');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(5n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(supplyKey_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = this._encryptZero_0();
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(4n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(true),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  __addMinted_0(context, partialProofData, value_0) {
    this._assertInitialized_0(context, partialProofData);
    const r_0 = this._expandRandomness_0(this._wit_SupplyRandomness_0(context,
                                                                      partialProofData),
                                         new Uint8Array([79, 90, 58, 99, 110, 116, 58, 115, 117, 112, 112, 108, 121, 58, 97, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const tmp_0 = this._addEncrypted_0(_descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                  partialProofData,
                                                                                                  [
                                                                                                   { dup: { n: 0 } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_27.toValue(1n),
                                                                                                                              alignment: _descriptor_27.alignment() } },
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_27.toValue(6n),
                                                                                                                              alignment: _descriptor_27.alignment() } }] } },
                                                                                                   { popeq: { cached: false,
                                                                                                              result: undefined } }]).value),
                                       _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                 partialProofData,
                                                                                                 [
                                                                                                  { dup: { n: 0 } },
                                                                                                  { idx: { cached: false,
                                                                                                           pushPath: false,
                                                                                                           path: [
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_27.toValue(1n),
                                                                                                                             alignment: _descriptor_27.alignment() } },
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_27.toValue(5n),
                                                                                                                             alignment: _descriptor_27.alignment() } }] } },
                                                                                                  { popeq: { cached: false,
                                                                                                             result: undefined } }]).value),
                                       value_0,
                                       r_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  __addBurned_0(context, partialProofData, value_0) {
    this._assertInitialized_0(context, partialProofData);
    const r_0 = this._expandRandomness_0(this._wit_SupplyRandomness_0(context,
                                                                      partialProofData),
                                         new Uint8Array([79, 90, 58, 99, 110, 116, 58, 115, 117, 112, 112, 108, 121, 58, 115, 117, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const tmp_0 = this._subEncrypted_0(_descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                  partialProofData,
                                                                                                  [
                                                                                                   { dup: { n: 0 } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_27.toValue(1n),
                                                                                                                              alignment: _descriptor_27.alignment() } },
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_27.toValue(6n),
                                                                                                                              alignment: _descriptor_27.alignment() } }] } },
                                                                                                   { popeq: { cached: false,
                                                                                                              result: undefined } }]).value),
                                       _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                 partialProofData,
                                                                                                 [
                                                                                                  { dup: { n: 0 } },
                                                                                                  { idx: { cached: false,
                                                                                                           pushPath: false,
                                                                                                           path: [
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_27.toValue(1n),
                                                                                                                             alignment: _descriptor_27.alignment() } },
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_27.toValue(5n),
                                                                                                                             alignment: _descriptor_27.alignment() } }] } },
                                                                                                  { popeq: { cached: false,
                                                                                                             result: undefined } }]).value),
                                       value_0,
                                       r_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _assertInitialized_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(1n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(4n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenPrivateSupply: extension not initialized');
    return [];
  }
  _expandRandomness_0(seed_0, tag_0) {
    return this._degradeToTransient_0(this._persistentHash_6([seed_0, tag_0]));
  }
  _JUBJUB_SUBGROUP_ORDER_MINUS_ONE_0() {
    return 6554484396890773809930967563523245729705921265872317281365359162392183254198n;
  }
  _ecNeg_0(p_0) {
    return this._ecMul_0(p_0, this._JUBJUB_SUBGROUP_ORDER_MINUS_ONE_0());
  }
  _encryptZero_0() {
    const id_0 = this._ecMulGenerator_0(0n); return { c1: id_0, c2: id_0 };
  }
  _encryptPoint_0(pk_0, m_0, r_0) {
    __compactRuntime.assert(!this._equal_8(pk_0, this._ecMulGenerator_0(0n)),
                            'ElGamal: identity pk');
    __compactRuntime.assert(r_0 !== 0n, 'ElGamal: zero randomness');
    const c1_0 = this._ecMulGenerator_0(r_0);
    const mask_0 = this._ecMul_0(pk_0, r_0);
    const c2_0 = this._ecAdd_0(mask_0, m_0); return { c1: c1_0, c2: c2_0 };
  }
  _encrypt_0(pk_0, value_0, r_0) {
    return this._encryptPoint_0(pk_0, this._ecMulGenerator_0(value_0), r_0);
  }
  _negate_0(ct_0) {
    return { c1: this._ecNeg_0(ct_0.c1), c2: this._ecNeg_0(ct_0.c2) };
  }
  _add_0(a_0, b_0) {
    return { c1: this._ecAdd_0(a_0.c1, b_0.c1),
             c2: this._ecAdd_0(a_0.c2, b_0.c2) };
  }
  _sub_0(a_0, b_0) { return this._add_0(a_0, this._negate_0(b_0)); }
  _addEncrypted_0(old_0, pk_0, value_0, r_0) {
    return this._add_0(old_0, this._encrypt_0(pk_0, value_0, r_0));
  }
  _subEncrypted_0(old_0, pk_0, value_0, r_0) {
    return this._sub_0(old_0, this._encrypt_0(pk_0, value_0, r_0));
  }
  __freeze_0(context, partialProofData, nf_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(9n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                                                                               alignment: _descriptor_8.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenFreeze: already frozen');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(9n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  __unfreeze_0(context, partialProofData, nf_0) {
    __compactRuntime.assert(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(1n),
                                                                                                                  alignment: _descriptor_27.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_27.toValue(9n),
                                                                                                                  alignment: _descriptor_27.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenFreeze: not frozen');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(9n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  __assertNotFrozen_0(context, partialProofData, nf_0) {
    __compactRuntime.assert(!_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(9n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(nf_0),
                                                                                                                                               alignment: _descriptor_8.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'ConfidentialNoteFungibleTokenFreeze: note is frozen');
    return [];
  }
  _derivePk_3(sk_0) {
    return this._degradeToTransient_0(this._persistentHash_2(sk_0));
  }
  _commitOf_1(note_0, pk_0) {
    return this._persistentHash_3({ domain:
                                      new Uint8Array([79, 90, 58, 99, 110, 116, 58, 99, 111, 109, 109, 105, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    value: note_0.value,
                                    nonce: note_0.nonce,
                                    pk: pk_0 });
  }
  _nullifierOf_1(note_0) {
    return this._persistentHash_4({ domain:
                                      new Uint8Array([79, 90, 58, 99, 110, 116, 58, 110, 117, 108, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    nonce: note_0.nonce });
  }
  _recoverAuditRecord_0(record_0, auditSk_0) {
    const shared_0 = this._ecMul_0(record_0.ephemeralPk, auditSk_0);
    return { value:
               __compactRuntime.subField(record_0.valueCt,
                                         this._kdf_2(shared_0,
                                                     new Uint8Array([79, 90, 58, 99, 110, 116, 58, 97, 58, 118, 97, 108, 117, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))),
             nonce:
               this._kdf_2(shared_0,
                           new Uint8Array([79, 90, 58, 99, 110, 116, 58, 110, 111, 110, 99, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
             ownerPk:
               __compactRuntime.subField(record_0.ownerCt,
                                         this._kdf_2(shared_0,
                                                     new Uint8Array([79, 90, 58, 99, 110, 116, 58, 97, 58, 111, 119, 110, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))) };
  }
  _kdf_2(sShared_0, domain_0) {
    const pointHash_0 = this._persistentHash_5(sShared_0);
    return this._degradeToTransient_0(this._persistentHash_6([pointHash_0,
                                                              domain_0]));
  }
  _kdf_3(shared_0, domain_0) {
    return this._degradeToTransient_0(this._persistentHash_6([this._persistentHash_5(shared_0),
                                                              domain_0]));
  }
  _recoverNote_0(delivery_0, encSk_0) {
    const shared_0 = this._ecMul_0(delivery_0.ephemeral, encSk_0);
    return { value:
               __compactRuntime.subField(delivery_0.valueCt,
                                         this._kdf_3(shared_0,
                                                     new Uint8Array([110, 111, 116, 101, 58, 118, 97, 108, 117, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))),
             nonce:
               __compactRuntime.subField(delivery_0.nonceCt,
                                         this._kdf_3(shared_0,
                                                     new Uint8Array([110, 111, 116, 101, 58, 110, 111, 110, 99, 101, 58, 99, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))) };
  }
  _mint_1(context, partialProofData, recipientPk_0, recipientEncPk_0, value_0) {
    return this._mint_0(context,
                        partialProofData,
                        recipientPk_0,
                        recipientEncPk_0,
                        value_0);
  }
  _transfer_1(context,
              partialProofData,
              recipientPk_0,
              recipientEncPk_0,
              senderEncPk_0,
              value_0)
  {
    return this._transfer_0(context,
                            partialProofData,
                            recipientPk_0,
                            recipientEncPk_0,
                            senderEncPk_0,
                            value_0);
  }
  _burn_1(context, partialProofData, senderEncPk_0, value_0) {
    return this._burn_0(context, partialProofData, senderEncPk_0, value_0);
  }
  _seize_1(context,
           partialProofData,
           targetOwnerPk_0,
           recoveryPk_0,
           recoveryEncPk_0)
  {
    return this._seize_0(context,
                         partialProofData,
                         targetOwnerPk_0,
                         recoveryPk_0,
                         recoveryEncPk_0);
  }
  _setFrozen_0(context, partialProofData, nf_0, isFrozen_0) {
    if (isFrozen_0) {
      this._freeze_0(context, partialProofData, nf_0);
    } else {
      this._unfreeze_0(context, partialProofData, nf_0);
    }
    return [];
  }
  _derivePk_4(sk_0) { return this._derivePk_3(sk_0); }
  _encPkOf_0(encSk_0) { return this._ecMulGenerator_0(encSk_0); }
  _commitOf_2(note_0, pk_0) { return this._commitOf_1(note_0, pk_0); }
  _nullifierOf_2(note_0) { return this._nullifierOf_1(note_0); }
  _recoverNote_1(delivery_0, encSk_0) {
    return this._recoverNote_0(delivery_0, encSk_0);
  }
  _recoverAuditRecord_1(record_0, auditSk_0) {
    return this._recoverAuditRecord_0(record_0, auditSk_0);
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 32; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_4(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_5(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_6(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_7(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_8(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get _seizureCount() {
      return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_27.toValue(0n),
                                                                                                    alignment: _descriptor_27.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_27.toValue(1n),
                                                                                                    alignment: _descriptor_27.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    _commitments: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(0n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(4294967296n),
                                                                                                                                 alignment: _descriptor_15.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 76 char 3',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(0n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_11.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0].asArray()[2];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0].asArray()[2];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 76 char 3',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 76 char 3',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[0].asArray()[2];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(32, _descriptor_8).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_8.toValue(leaf_0),      alignment: _descriptor_8.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 76 char 3',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[0].asArray()[2];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(32, _descriptor_8).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_8.toValue(leaf_0),      alignment: _descriptor_8.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0].asArray()[2];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    _nullifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(0n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(3n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                                 alignment: _descriptor_15.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(0n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(3n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'src/./oz-note/token/presets/../ConfidentialNoteFungibleToken.compact line 77 char 3',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(0n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(3n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_8.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0].asArray()[3];
        return self_0.asMap().keys().map((elem) => _descriptor_8.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    get _issuerPk() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(5n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get _authorityPk() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(7n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get _auditKey() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    _auditTrail: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'type',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                 alignment: _descriptor_27.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(1n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(2n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(2n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_25.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(1n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(2n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(0n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { dup: { n: 0 } },
                                                                           'type',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                  alignment: _descriptor_27.alignment() }).encode() } },
                                                                           'eq',
                                                                           { branch: { skip: 4 } },
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                  alignment: _descriptor_27.alignment() }).encode() } },
                                                                           { swap: { n: 0 } },
                                                                           { concat: { cached: false,
                                                                                       n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                                               _descriptor_4
                                                                                               .alignment()
                                                                                             ))) } },
                                                                           { jmp: { skip: 2 } },
                                                                           'pop',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                                  { value: _descriptor_27.toValue(0n),
                                                                                                                                    alignment: _descriptor_27.alignment() },
                                                                                                                                  { value: _descriptor_4.toValue({ ephemeralPk: ({x: 0n, y: 1n}), valueCt: 0n, ownerCt: 0n }),
                                                                                                                                    alignment: _descriptor_4.alignment() }
                                                                                                                                )).encode() } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1].asArray()[2];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_4.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    },
    _deliveries: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(3n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'type',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                 alignment: _descriptor_27.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(1n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(3n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(2n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_26.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(1n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(3n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(0n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           { dup: { n: 0 } },
                                                                           'type',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                  alignment: _descriptor_27.alignment() }).encode() } },
                                                                           'eq',
                                                                           { branch: { skip: 4 } },
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                                                                  alignment: _descriptor_27.alignment() }).encode() } },
                                                                           { swap: { n: 0 } },
                                                                           { concat: { cached: false,
                                                                                       n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                                               _descriptor_2
                                                                                               .alignment()
                                                                                             ))) } },
                                                                           { jmp: { skip: 2 } },
                                                                           'pop',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                                  { value: _descriptor_27.toValue(0n),
                                                                                                                                    alignment: _descriptor_27.alignment() },
                                                                                                                                  { value: _descriptor_2.toValue({ ephemeral: ({x: 0n, y: 1n}), valueCt: 0n, nonceCt: 0n }),
                                                                                                                                    alignment: _descriptor_2.alignment() }
                                                                                                                                )).encode() } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1].asArray()[3];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_2.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    },
    get _supplyKey() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                   alignment: _descriptor_27.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(5n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get _encSupply() {
      return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_27.toValue(1n),
                                                                                                    alignment: _descriptor_27.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_27.toValue(6n),
                                                                                                    alignment: _descriptor_27.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    _frozen: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(9n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                                                                 alignment: _descriptor_15.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(1n),
                                                                                                      alignment: _descriptor_27.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_27.toValue(9n),
                                                                                                      alignment: _descriptor_27.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'ConfidentialNoteFungibleTokenFreeze.compact line 40 char 3',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(9n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_8.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1].asArray()[9];
        return self_0.asMap().keys().map((elem) => _descriptor_8.fromValue(elem.value))[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  wit_SecretKey: (...args) => undefined,
  wit_InputNote: (...args) => undefined,
  wit_Path: (...args) => undefined,
  wit_IssuerSecret: (...args) => undefined,
  wit_AuthoritySecret: (...args) => undefined,
  wit_AuditRandomness: (...args) => undefined,
  wit_DeliveryRandomness: (...args) => undefined,
  wit_SupplyRandomness: (...args) => undefined
});
export const pureCircuits = {
  derivePk: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`derivePk: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('derivePk',
                                 'argument 1',
                                 'cft-note.compact line 135 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._derivePk_4(sk_0);
  },
  encPkOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`encPkOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const encSk_0 = args_0[0];
    if (!(typeof(encSk_0) === 'bigint' && encSk_0 >= 0 && encSk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('encPkOf',
                                 'argument 1',
                                 'cft-note.compact line 140 char 1',
                                 'Field',
                                 encSk_0)
    }
    return _dummyContract._encPkOf_0(encSk_0);
  },
  commitOf: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`commitOf: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const note_0 = args_0[0];
    const pk_0 = args_0[1];
    if (!(typeof(note_0) === 'object' && typeof(note_0.value) === 'bigint' && note_0.value >= 0n && note_0.value <= 340282366920938463463374607431768211455n && typeof(note_0.nonce) === 'bigint' && note_0.nonce >= 0 && note_0.nonce <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('commitOf',
                                 'argument 1',
                                 'cft-note.compact line 144 char 1',
                                 'struct Note<value: Uint<0..340282366920938463463374607431768211456>, nonce: Field>',
                                 note_0)
    }
    if (!(typeof(pk_0) === 'bigint' && pk_0 >= 0 && pk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('commitOf',
                                 'argument 2',
                                 'cft-note.compact line 144 char 1',
                                 'Field',
                                 pk_0)
    }
    return _dummyContract._commitOf_2(note_0, pk_0);
  },
  nullifierOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`nullifierOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const note_0 = args_0[0];
    if (!(typeof(note_0) === 'object' && typeof(note_0.value) === 'bigint' && note_0.value >= 0n && note_0.value <= 340282366920938463463374607431768211455n && typeof(note_0.nonce) === 'bigint' && note_0.nonce >= 0 && note_0.nonce <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('nullifierOf',
                                 'argument 1',
                                 'cft-note.compact line 148 char 1',
                                 'struct Note<value: Uint<0..340282366920938463463374607431768211456>, nonce: Field>',
                                 note_0)
    }
    return _dummyContract._nullifierOf_2(note_0);
  },
  recoverNote: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`recoverNote: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const delivery_0 = args_0[0];
    const encSk_0 = args_0[1];
    if (!(typeof(delivery_0) === 'object' && true && typeof(delivery_0.valueCt) === 'bigint' && delivery_0.valueCt >= 0 && delivery_0.valueCt <= __compactRuntime.MAX_FIELD && typeof(delivery_0.nonceCt) === 'bigint' && delivery_0.nonceCt >= 0 && delivery_0.nonceCt <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('recoverNote',
                                 'argument 1',
                                 'cft-note.compact line 153 char 1',
                                 'struct FullDelivery<ephemeral: Opaque<"JubjubPoint">, valueCt: Field, nonceCt: Field>',
                                 delivery_0)
    }
    if (!(typeof(encSk_0) === 'bigint' && encSk_0 >= 0 && encSk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('recoverNote',
                                 'argument 2',
                                 'cft-note.compact line 153 char 1',
                                 'Field',
                                 encSk_0)
    }
    return _dummyContract._recoverNote_1(delivery_0, encSk_0);
  },
  recoverAuditRecord: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`recoverAuditRecord: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const record_0 = args_0[0];
    const auditSk_0 = args_0[1];
    if (!(typeof(record_0) === 'object' && true && typeof(record_0.valueCt) === 'bigint' && record_0.valueCt >= 0 && record_0.valueCt <= __compactRuntime.MAX_FIELD && typeof(record_0.ownerCt) === 'bigint' && record_0.ownerCt >= 0 && record_0.ownerCt <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('recoverAuditRecord',
                                 'argument 1',
                                 'cft-note.compact line 158 char 1',
                                 'struct AuditRecord<ephemeralPk: Opaque<"JubjubPoint">, valueCt: Field, ownerCt: Field>',
                                 record_0)
    }
    if (!(typeof(auditSk_0) === 'bigint' && auditSk_0 >= 0 && auditSk_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('recoverAuditRecord',
                                 'argument 2',
                                 'cft-note.compact line 158 char 1',
                                 'Field',
                                 auditSk_0)
    }
    return _dummyContract._recoverAuditRecord_1(record_0, auditSk_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
