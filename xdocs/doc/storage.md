# Protos Token Smart Contract: Storage #

This document describes structure of storage of Protos Token smart contract.

## 1. State Variables ##

### 1.1. owner ###

#### Declaration: ####

    address owner

#### Description: ####

Address of an owner of the contract.

#### Used in Use Cases: ####

* Token:Create
* Admin:Freeze
* Admin:Unfreeze
* Admin:SetOwner

#### Modified in Use Cases: ####

* Admin:Deploy
* Admin:SetOwner

### 1.2. tokenCount ###

#### Declaration: ####

    uint256 tokenCount

#### Description: ####

Total number of tokens in circulation.

#### Used in Use Cases: ####

* ERC20:TotalSupply
* Token:Create
* Token:Burn

#### Modified in Use Cases: ####

* Token:Create
* Token:Burn

### 1.3. frozen ###

#### Declaration: ####

    bool frozen

#### Description: ####

Whether token transfers are currently frozen.

#### Used in Use Cases: ####

* ERC20:Transfer
* ERC20:TransferFrom
* Admin:Freeze
* Admin:Unfreeze

#### Modified in Use Cases: ####

* Admin:Freeze
* Admin:Unfreeze

### 1.4. accounts ###

#### Declaration: ####

    mapping (address => uint256) accounts

#### Description: ####

Accounts of token holders.  Value of ``accounts [x]`` is the number of tokens currently belonging to the owner of address ``x``.

#### Used in Use Cases: ####

* ERC20:Transfer
* ERC20:TransferFrom
* Token:Create

#### Modified in Use Cases: ####

* ERC20:Transfer
* ERC20:TransferFrom
* Token:Create

### 1.5. allowances ###

#### Declaration: ####

    mapping (address => mapping (address => uint256)) allowances

#### Description: ####

Approved transfers.  Value of ``allowances [x][y]`` is how many of tokens belonging to the owner of address ``x``, owner of address ``y`` is allowed to transfer.

#### Used in Use Cases: ####

* ERC20:TransferFrom
* ERC20:Allowance

#### Modified in Use Cases: ####

* ERC20:Approve