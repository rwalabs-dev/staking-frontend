"use client";

import { BigNumber } from "ethers";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { StakingPoolContract } from "@/config/contracts";
import { Button } from "@/components/Button";
import { useUserInfo } from "@/hooks/useUserInfo";
import { usePoolInfo } from "@/hooks/usePoolInfo";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useBigNumber, useBigNumberInput } from "@/modules/bigNumber";

function useUnstake(amount: BigNumber, reset: () => void) {
    const userInfo = useUserInfo()
    const poolInfo = usePoolInfo()

    const prepare = usePrepareContractWrite({
        ...StakingPoolContract,
        functionName: "unstake",
        args: [amount],
        enabled: userInfo.isSuccess
            && amount.gt(0)
            && amount.lte(userInfo.data?.staking.staked ?? 0),
    })

    const action = useContractWrite(prepare.config)

    const wait = useWaitForTransaction({
        hash: action.data?.hash, onSuccess() {
            userInfo.refetch()
            poolInfo.refetch()
            reset()
        }
    })

    return { prepare, action, wait }
}

export function UnstakeForm() {
    const tokenInfo = useTokenInfo()
    const [amount, setAmount] = useBigNumber(0)
    const [amountStr, setAmountStr] = useBigNumberInput(amount, setAmount, tokenInfo.data?.staking.decimals ?? 0)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={amountStr}
                    onChange={e => setAmountStr.fromStr(e.target.value.trim())}
                />
                <MaxButton setAmount={setAmountStr.fromBigNumber} />
            </div>
            <div>
                <UnstakeButton amount={amount} reset={setAmountStr.reset} />
            </div>
        </div>
    )
}

function MaxButton({ setAmount }: { setAmount: (amount: BigNumber) => void }) {
    const userInfo = useUserInfo()
    const hasMounted = useHasMounted()

    const staked = userInfo.data?.staking.staked ?? BigNumber.from(0)

    const disabled = !hasMounted || !userInfo.isSuccess;

    return (
        <Button disabled={disabled} onClick={() => setAmount(staked)}>
            Max
        </Button>
    )
}

function UnstakeButton({ amount, reset }: { amount: BigNumber, reset: () => void }) {
    const userInfo = useUserInfo()
    const { prepare, action, wait } = useUnstake(amount, reset)

    const staked = userInfo.data?.staking.staked ?? BigNumber.from(0)

    const zeroAmount = amount.eq(0)
    const insufficientStaked = amount.gt(staked)

    const preparing = prepare.isLoading || prepare.isError || !action.write
    const sending = action.isLoading || wait.isLoading
    const disabled = zeroAmount || insufficientStaked || !userInfo.isSuccess || preparing || sending

    return (
        <Button disabled={disabled} loading={sending} onClick={() => action.write?.()}>
            {insufficientStaked ? 'Insufficient stake' : 'Unstake tokens'}
        </Button>
    )
}
