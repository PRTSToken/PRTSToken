/*
 * Test for Protos Token Smart Contract.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "ProtosToken",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys three Wallet contracts: Bob, Carol and Dave",
      body: function (test) {
        loadScript (
          "target/test-solc-js/Wallet.abi.js");
        var walletABI = _;
        loadScript (
          "target/test-solc-js/Wallet.bin.js");
        var walletCode = _;
        test.walletContract =
          web3.eth.contract (walletABI);

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
          web3.eth.getTransactionReceipt (test.tx3);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx1).contractAddress',
          web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx2).contractAddress',
          web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx3).contractAddress',
          web3.eth.getTransactionReceipt (test.tx3).contractAddress);

        test.bob = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        test.carol = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        test.dave = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx3).contractAddress);
      }},
    { name: "Alice deploys ProtosTokenWrapper contract",
      body: function (test) {
        loadScript (
          "target/test-solc-js/ProtosTokenWrapper.abi.js");
        var protosTokenWrapperABI = _;
        loadScript (
          "target/test-solc-js/ProtosTokenWrapper.bin.js");
        var protosTokenWrapperCode = _;
        test.protosTokenWrapperContract =
          web3.eth.contract (protosTokenWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.protosTokenWrapperContract.new (
          {
            from: test.alice,
            data: protosTokenWrapperCode,
            gas: 2000000
          }).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        test.protosTokenWrapper =
          test.protosTokenWrapperContract.at (
            web3.eth.getTransactionReceipt (test.tx).contractAddress);

        assert ('"PROTOS" == test.protosTokenWrapper.name ()',
            "PROTOS" == test.protosTokenWrapper.name ());

        assert ('"PRTS" == test.protosTokenWrapper.symbol ()',
            "PRTS" == test.protosTokenWrapper.symbol ());

        assert ('0 == test.protosTokenWrapper.decimals ()',
            0 == test.protosTokenWrapper.decimals ());
      }},
    { name: "Alice makes Bob the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.protosTokenWrapper.setOwner (
          test.bob.address,
          {
            from: test.alice,
            gas: 1000000
          });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Dave tries to create 1000 tokens but he is not an owner of the contract",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 0',
          test.protosTokenWrapper.totalSupply () == 0);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 0',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        assert (
          'test.protosTokenWrapper.totalSupply () == 0',
          test.protosTokenWrapper.totalSupply () == 0);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 0',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 0);
      }},
    { name: "Bob creates 1000 tokens",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 0',
          test.protosTokenWrapper.totalSupply () == 0);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 0',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure 1000 tokens were created and given to Bob",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.totalSupply () == 1000',
          test.protosTokenWrapper.totalSupply () == 1000);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 1000',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 1000);
      }},
    { name: "Dave tries to freeze token transfers but he is not an owner of the contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure freeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.protosTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob transfers 1 token to Dave",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 1000',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 1000);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 0',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 999',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 999);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 1',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 1);
      }},
    { name: "Bob allows Carol to transfer 100 of his tokens",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 0',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.approve.getData (
              test.carol.address,
              100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now allowed to transfer 100 Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.protosTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
            'approvalEvents [0].args._owner == test.bob.address',
            approvalEvents [0].args._owner == test.bob.address);

        assert (
            'approvalEvents [0].args._spender == test.carol.address',
            approvalEvents [0].args._spender == test.carol.address);

        assert (
            'approvalEvents [0].args._value == 100',
            approvalEvents [0].args._value == 100);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 100',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 100);
      }},
    { name: "Carol transfers 1 Bob's token to Dave",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 999',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 999);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 1',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 1);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 100',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 100);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token and Carol's allowance decreased by 1",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);
      }},
    { name: "Bob freezes token transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were frozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.protosTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 1',
          freezeEvents.length == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob freezes token transfers again",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure freeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.protosTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Dave tries to unfreeze token transfers but he is not an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure unfreeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.protosTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob tries to transfer 1 token to Dave, but transfers are frozen",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);
      }},
    { name: "Carol tries to transfer 1 Bob's token to Dave but transfers are frozen",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);
      }},
    { name: "Bob unfreezes token transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were unfrozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.protosTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 1',
          unfreezeEvents.length == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob unfreezes token transfers again",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure unfreeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.protosTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob transfers 1 token to Dave",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 998',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 2',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 2);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 997',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 997);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 3',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 3);
      }},
    { name: "Carol transfers 1 Bob's token to Dave",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 997',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 997);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 3',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 3);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token and Carol's allowance decreased by 1",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.protosTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.balanceOf (test.bob.address) == 996',
          test.protosTokenWrapper.balanceOf (test.bob.address) == 996);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 4',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 4);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);
      }},
    { name: "Bob tries to allow Carol to transfer 200 of his tokens assuming that current allowance is 97 while actual allowance is 98",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.approve['address,uint256,uint256'].getData (
              test.carol.address,
              97,
              200),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure allowance was not changed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.protosTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 0',
          approvalEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);
      }},
    { name: "Bob allows Carol to transfer 200 of his tokens assuming that current allowance is 98 which is correct",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.approve['address,uint256,uint256'].getData (
              test.carol.address,
              98,
              200),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now able to transfer 200 of Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.protosTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
          'approvalEvents [0].args._owner == test.bob.address',
          approvalEvents [0].args._owner == test.bob.address);

        assert (
          'approvalEvents [0].args._spender == test.carol.address',
          approvalEvents [0].args._spender == test.carol.address);

        assert (
          'approvalEvents [0].args._value == 200',
          approvalEvents [0].args._value == 200);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 2',
          resultEvents.length == 2);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'resultEvents [1].args._value',
          resultEvents [1].args._value);

        assert (
          'test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 200',
          test.protosTokenWrapper.allowance (test.bob.address, test.carol.address) == 200);
      }},
    { name: "Carol tries to make Dave an owner of the smart contract but she is not an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.setOwner.getData (test.dave.address),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Dave tries to create 1 token but he is not an owner of the smart contract",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 1000',
          test.protosTokenWrapper.totalSupply () == 1000);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 4',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 4);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        assert (
          'test.protosTokenWrapper.totalSupply () == 1000',
          test.protosTokenWrapper.totalSupply () == 1000);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 4',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 4);
      }},
    { name: "Bob makes Dave an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.setOwner.getData (test.dave.address),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction executed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

      }},
    { name: "Dave creates 1 token",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 1000',
          test.protosTokenWrapper.totalSupply () == 1000);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 4',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 4);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token was created and given to Dave",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.totalSupply () == 1001',
          test.protosTokenWrapper.totalSupply () == 1001);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 5',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 5);
      }},
    { name: "Dave tries to create 2^256 - 1001 tokens which would exceed limit for number of tokens in circulation",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 1001',
          test.protosTokenWrapper.totalSupply () == 1001);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 5',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 5);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (
            web3.toBigNumber ('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC17')),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.protosTokenWrapper.totalSupply () == 1001',
          test.protosTokenWrapper.totalSupply () == 1001);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dsve.address) == 5',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 5);
      }},
    { name: "Dave creates 2^256 - 1002 tokens",
      body: function (test) {
        assert (
          'test.protosTokenWrapper.totalSupply () == 1001',
          test.protosTokenWrapper.totalSupply () == 1001);

        assert (
          'test.protosTokenWrapper.balanceOf (test.dave.address) == 5',
          test.protosTokenWrapper.balanceOf (test.dave.address) == 5);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.createTokens.getData (
            web3.toBigNumber ('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC16')),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.protosTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.protosTokenWrapper.totalSupply ())',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.protosTokenWrapper.totalSupply ()));

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B").eq (test.protosTokenWrapper.balanceOf (test.dave.address))',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B").eq (test.protosTokenWrapper.balanceOf (test.dave.address)));
      }},
    { name: "Bob tries to burn 997 tokens but he has only 996",
      body: function (test) {
        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.protosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.burnTokens.getData (997),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.protosTokenWrapper.Result",
          test.protosTokenWrapper,
          test.protosTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.protosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 0 tokens",
      body: function (test) {
        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.protosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.protosTokenWrapper.Result",
          test.protosTokenWrapper,
          test.protosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.protosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 100 tokens",
      body: function (test) {
        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.protosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.burnTokens.getData (100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.protosTokenWrapper.Result",
          test.protosTokenWrapper,
          test.protosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF9B",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          896,
          test.protosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 896 tokens",
      body: function (test) {
        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF9B",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          896,
          test.protosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.burnTokens.getData (896),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.protosTokenWrapper.Result",
          test.protosTokenWrapper,
          test.protosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.protosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 0 tokens",
      body: function (test) {
        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.protosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.protosTokenWrapper.address,
          test.protosTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.protosTokenWrapper.Result",
          test.protosTokenWrapper,
          test.protosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.protosTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.protosTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.protosTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.protosTokenWrapper.balanceOf (test.bob.address));
      }}
  ]});