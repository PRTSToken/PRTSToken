/*
 * Wrapper for Protos Token Smart Contract.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.16;

import "./../../src/sol/ProtosToken.sol";

/**
 * Wrapper for Protos Token Smart Contract.
 */
contract ProtosTokenWrapper is ProtosToken {
  /**
   * Create new Protos Token smart contract and make message sender to be the
   * owner of the smart contract.
   */
  function ProtosTokenWrapper ()
    ProtosToken () {
    // Do nothing
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens from the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) returns (bool success) {
    bool result = ProtosToken.transfer (_to, _value);
    Result (result);
    return result;
  }

  /**
   * Transfer given number of tokens from given owner to given recipient.
   *
   * @param _from address to transfer tokens from the owner of
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer from given owner to given
   *        recipient
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transferFrom (address _from, address _to, uint256 _value)
  returns (bool success)
  {
    bool result = ProtosToken.transferFrom (_from, _to, _value);
    Result (result);
    return result;
  }

  /**
   * Allow given spender to transfer given number of tokens from message sender.
   *
   * @param _spender address to allow the owner of to transfer tokens from
   *        message sender
   * @param _value number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _value) returns (bool success) {
    bool result = AbstractToken.approve (_spender, _value);
    Result (result);
    return result;
  }

  /**
   * Change how many tokens given spender is allowed to transfer from message
   * spender.  In order to prevent double spending of allowance, this method
   * receives assumed current allowance value as an argument.  If actual
   * allowance differs from an assumed one, this method just returns false.
   *
   * @param _spender address to allow the owner of to transfer tokens from
   *        message sender
   * @param _currentValue assumed number of tokens currently allowed to be
   *        transferred
   * @param _newValue number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _currentValue, uint256 _newValue)
  returns (bool success) {
    bool result = ProtosToken.approve (_spender, _currentValue, _newValue);
    Result (result);
    return result;
  }

  /**
   * Create certain number of new tokens and give them to the owner of the
   * contract.
   * 
   * @param _value number of new tokens to create
   * @return true if tokens were created successfully, false otherwise
   */
  function createTokens (uint256 _value)
  returns (bool success) {
    bool result = ProtosToken.createTokens (_value);
    Result (result);
    return result;
  }

  /**
   * Burn given number of tokens belonging to message sender.
   *
   * @param _value number of tokens to burn
   * @return true on success, false on error
   */
  function burnTokens (uint256 _value) returns (bool success) {
    Result (success = ProtosToken.burnTokens (_value));
  }

  /**
   * Holds result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);
}