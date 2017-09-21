# Protos Token Smart Contract: Functional Requirements #

This document summarizes functional requirements for a Protos Token smart contract.

## 1. Functional Blocks ##

This section describes high-level blocks of functionality and lists use cases for each block.

### 1.1. ERC-20 API Support ###

To make Protos Token compatible with existing wallets, exchanges, blockchain explorers and other software constituting Ethereum ecosystem, Protos Token Smart Contract have to implement standard Ethereum Token API known as ERC-20.  This API is defined here: https://github.com/ethereum/EIPs/issues/20.  Apart from ERC-20, Protos Token also implements some non-standard extensions of ERC-20.  Use cases corresponding to these extensions are marked with 'ERC20*' prefix.

#### Use cases: ####

1. ERC20*:Name - Get name of the token
2. ERC20*:Symbol - Get symbol of the token
3. ERC20*:Decimals - Get number of decimals for the token
4. ERC20:TotalSupply - Retrieve the total number of tokens in circulation
5. ERC20:BalanceOf - Know how many tokens belongs to the owner of a certain address
6. ERC20:Transfer - Transfer own tokens to a certain address
7. ERC20:TransferFrom - Transfer other's tokens to a certain address
8. ERC20:Approve - Allow certain number of own tokens to be transferred by the owner of the certain address
9. ERC20*:SafeApprove - Safely allow certain number of own tokens to be transferred by the owner of the certain address
10. ERC20:Allowance - Know how many tokens belonging to the owner of one address the owner of another address is currently allowed to transfer

### 1.2. Token Creation and Burning ###

This functional block allows the owner of the smart contract to issue (i.e. create) more tokens and also it allows any token holder to burn (destroy) his tokens.

#### Use Cases: ####

1. Token:Burn - Burn (i.e. destroy) tokens
2. Token:Create - Issue (i.e. create) more tokens

### 1.3. Administration ###

This functional block contains various administration functionality.

#### Use Cases: ####

1. Admin:Deploy - Create token smart contract
2. Admin:Freeze - Suspend token transfers, so all transfer requests will be rejected until contract is unfrozen
3. Admin:Unfreeze - Resume token transfers
4. Admin:SetOwner - Set new owner for the contract

## 2. ERC-20 API Support Use Cases ##

This section describes use cases from ERC-20 API Support functional block.

### 2.1. ERC20*:Name ###

**Actors:** User, Smart Contract

**Goal:** User wants to know name of the token

#### Main Flow: ####

1. User calls constant method on Smart Contract (constant method means method that does not modify blockchain state, so such method may be called locally consuming zero gas)
2. Smart Contract returns name of the token to the User

### 2.2. ERC20*:Symbol ###

**Actors:** User, Smart Contract

**Goal:** User wants to know symbol of the token

#### Main Flow: ####

1. User calls constant method on Smart Contract
2. Smart Contract returns symbol of the token to the User

### 2.3. ERC20*:Decimals ###

**Actors:** User, Smart Contract

**Goal:** User wants to know how many tokens are currently in circulation

#### Main Flow: ####

1. User calls constant method on Smart Contract
2. Smart Contract returns number of decimals for the token to the User

### 2.4. ERC20:TotalSupply ###

**Actors:** User, Smart Contract

**Goal:** User wants to know how many tokens are currently in circulation

#### Main Flow: ####

1. User calls constant method on Smart Contract
2. Smart Contract returns total number of tokens in circulation to the User

### 2.5. ERC20:BalanceOf ###

**Actors:** User, Smart Contract

**Goal:** User wants to know how many tokens currently belong to the owner of certain address

#### Main Flow: ####

1. User calls constant method on Smart Contract providing the following information as method parameters: address User wants to know number of tokens belonging to
2. Smart Contract returns to User number of tokens currently belonging to the given address

### 2.6. ERC20:Transfer ###

**Actors:** Owner, Smart Contract

**Goal:** Owner wants to transfer certain amount of his tokens to the owner of certain address

#### Main Flow: ####

1. Owner calls method on Smart Contract providing the following information as method parameters: number of tokens to transfer, address Owner wants to transfer tokens to the owner of
2. Transfers are not currently frozen
3. Owner currently has enough tokens to transfer
4. Smart Contract transfers requested number of tokens from Owner to the owner of the given address
5. Some tokens actually did change hands during transfer, i.e. number of tokens transferred is more than zero and destination address is not the same as source address
6. Smart Contract logs token transfer event with the following information: number of tokens transferred, Owner's address, the address tokens were transferred to the owner of
7. Smart Contract returns success indicator to Owner

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Transfers are currently frozen
3. Smart Contract returns error indicator to Owner

#### Exceptional Flow 2: ####

1. Same as in main flow
2. Same as in main flow
3. Owner currently does not have enough tokens to transfer
4. Smart Contract returns error indicator to Owner

#### Exceptional Flow 3: ####

1. Same as in main flow
2. Same as in main flow
3. Same as in main flow
4. Same as in main flow
5. No tokens actually did change hands during transfer, i.e. number of tokens transferred is zero or destination address is not the same as source address
6. Smart Contract returns success indicator to Owner

### 2.7. ERC20:TransferFrom ###

**Actors:** Spender, Smart Contract

**Goal:** Spender wants to transfer certain number of tokens from the owner of certain source address to the owner of certain destination address

#### Main Flow: ####

1. Spender calls method on Smart Contract providing the following information as method parameters: number of tokens to transfer, source address, destination address
2. Transfers are not currently frozen
3. Spender is currently allowed to transfer requested number of tokens belonging to the owner of source address
4. The owner of the source address has enough tokens to transfer
5. Smart Contract transfers requested number of tokens from the owner of source address to the source address to the owner of the destination address
6. Smart Contract reduces number of tokens belonging to the owner of source address that Spender is allowed to transfer
7. Some tokens actually did change hands during transfer, i.e. number of tokens transferred is more than zero and destination address is not the same as source address
8. Smart Contract logs token transfer event with the following information: number of tokens transferred, source address, destination address
9. Smart Contract returns success indicator to Spender

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Transfers are currently frozen
3. Smart Contract returns error indicator to Spender

#### Exceptional Flow 2: ####

1. Same as in main flow
2. Same as in main flow
3. Spender is currently not allowed to transfer requested number of tokens belonging to the owner of source address
4. Smart Contract returns error indicator to Spender

#### Exceptional Flow 3: ####

1. Same as in main flow
2. Same as in main flow
3. Same as in main flow
4. The owner of the source address does not have enough tokens to transfer
5. Smart Contract returns error indicator to Spender

#### Exceptional Flow 4: ####

1. Same as in main flow
2. Same as in main flow
3. Same as in main flow
4. Same as in main flow
5. Same as in main flow
6. Same as in main flow
7. No tokens actually did change hands during transfer, i.e. number of tokens transferred is zero or destination address is not the same as source address
8. Smart Contract returns success indicator to Spender

### 2.8. ERC20:Approve ###

**Actors:** Owner, Smart Contract

**Goal:** Owner wants to set how many of the tokens belonging to Owner, the owner of certain address is allowed to transfer

#### Main Flow: ####

1. Owner calls method on Smart Contract providing the following information as method parameters: number of tokens to allow to be transferred by the owner of the certain address, address to allow the owner of to transfer certain number of tokens belonging to the Owner
2. Smart Contract sets to given value the number of tokens belonging to Owner that are allowed to be transferred by the owner of the given address
3. Smart Contract logs token transfer approval event with the following information: number of tokens allowed to transfer, Owner's address, address tokens were approved to be transferred by the owner of
4. Smart Contract returns success indicator to Owner

### 2.9. ERC20*:SafeApprove ###

**Actors:** Owner, Smart Contract

**Goal:** Owner wants to change the number of tokens belonging to Owner, the owner of certain address is allowed to transfer

#### Main Flow: ####

1. Owner calls method on Smart Contract providing the following information as method parameters: number of token belonging to Owner, the owner of certain address is currently allowed to transfer, i.e. current allowance, number of tokens to allow to be transferred by the owner of the certain address, address to allow the owner of to transfer certain number of tokens belonging to the Owner
2. Actual number of tokens belonging to Owner, the owner of specified address is allowed to transfer equals to the current allowance passed as method parameter
3. Smart Contract sets to given value the number of tokens belonging to Owner that are allowed to be transferred by the owner of the given address
4. Smart Contract logs token transfer approval event with the following information: number of tokens allowed to transfer, Owner's address, address tokens were approved to be transferred by the owner of
5. Smart Contract returns success indicator to Owner

#### Exceptional Flow 1: ####

1. Same as in Main Flow
2. Actual number of tokens belonging to Owner, the owner of specified address is allowed to transfer does not equal to the current allowance passed as method parameter
3. Smart Contract returns error indicator to Sender

### 2.10. ERC20:Allowance ###

**Actors:** User, Smart Contract

**Goal:** User wants to know how many tokens belonging to the owner of certain source address, the owner of the certain spender's address is currently allowed to transfer

#### Main Flow: ####

1. User calls constant method on Smart Contract providing the following information as method parameters: source address, spender's address
2. Smart Contract returns to User the number of tokens belonging to the owner of given source address the owner of given spender's address is currently allowed to transfer

## 3. Token Creation and Burning Use Cases ##

This section describes use cases from Token Creation functional block.

### 3.1. Token:Create ###

**Actors:** Issuer, Smart Contract

**Goal:** Issuer wants to create more tokens

#### Main Flow: ####

1. Issuer calls method on Smart Contract providing the following information as method parameters: number of new tokens to create
2. Issuer is currently an owner of Smart Contract
3. After creating requested number of new tokens, total number of tokens in circulation will not exceed maximum allowed total number of tokens
4. Smart Contract creates requested number of new tokens
5. Smart Contract gives new created tokens to Issuer
6. Smart Contract returns success indicator to Issuer

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Issuer is currently not an owner of Smart Contract
3. Smart Contract cancels the transaction

#### Exceptional Flow 2: ####

1. Same as in main flow
2. Same as in main flow
3. After creating requested number of new tokens, total number of tokens in circulation will exceed maximum allowed total number of tokens
4. Smart Contract returns error indicator to Issuer

### 3.2. Token:Burn ###

**Actors:** User, Smart Contract

**Goal:** User wants to burn (i.e. destroy) certain number of tokens

#### Main Flow: ####

1. User calls method on Smart Contract and provides the following information as method parameters: number of tokens to be burned
2. User currently has requested number of tokens
3. Smart Contract burns requested number of tokens belonging to User
4. Smart Contract returns success indicator to User

#### Exceptional Flow 1: ####

1. Same as in Main Flow
2. User currently does not have requested number of tokens
3. Smart Contract returns error indicator to User

## 4. Administration Use Cases ##

This section describes use cases from Administration functional block.

### 4.1. Admin:Deploy ###

**Actors:** Administrator, Smart Contract

**Goal:** Administrator wants to deploy smart contract

#### Main Flow: ####

1. Administrator deploys Smart Contract
2. Smart Contract makes Administrator to be the owner of Smart Contract

### 4.2. Admin:Freeze ###

**Actors:** Administrator, Smart Contract

**Goal:** Administrator wants to freeze token transfers

#### Main Flow: ####

1. Administrator calls method on Smart Contract
2. Administrator is currently an owner of Smart Contract
3. Token transfers are not currently frozen
4. Smart Contract freezes token transfers
5. Smart Contract logs transfers freeze event

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Administrator is currently not an owner of Smart Contract
3. Smart Contract cancels the transaction

#### Exceptional Flow 2: ####

1. Same as in main flow
2. Same as in main flow
3. Token transfers are currently frozen
4. Smart Contract does nothing

### 4.3. Admin:Unfreeze ###

**Actors:** Administrator, Smart Contract

**Goal:** Administrator wants to unfreeze token transfers

#### Main Flow: ####

1. Administrator calls method on Smart Contract
2. Administrator is currently an owner of Smart Contract
3. Token transfers are currently frozen
4. Smart Contract unfreezes token transfers
5. Smart Contract logs transfers unfreeze event

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Administrator is currently not an owner of Smart Contract
3. Smart Contract cancels the transaction

#### Exceptional Flow 2: ####

1. Same as in main flow
2. Same as in main flow
3. Token transfers are not currently frozen
4. Smart Contract does nothing

### 4.4. Admin:SetOwner ###

**Actors:** Administrator, Smart Contract

**Goal:** Administrator wants to change owner of Smart Contract

#### Main Flow: ####

1. Administrator calls method on Smart Contract providing the following information as method parameters: address of the new owner of Smart Contract
2. Administrator is currently an owner of Smart Contract
3. Smart Contract changes its owner to the owner of given address

#### Exceptional Flow 1: ####

1. Same as in main flow
2. Administrator is currently not an owner of Smart Contract
3. Smart Contract cancels the transaction

## 5. Limits ##

In order to make arithmetic overflow impossible, the following limits are established:

|         Limit | Value                                            |
|---------------|--------------------------------------------------|
|  ``2^64 - 1`` | Maximum allowed tokens in circulation            |