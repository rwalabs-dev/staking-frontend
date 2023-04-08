"use client";

import { BigNumber, ethers } from "ethers";
import { usePoolInfo } from "@/hooks/usePoolInfo";
import { useHasMounted } from "@/hooks/useHasMounted";

export function PoolEndOfDistribution() {
    const poolInfo = usePoolInfo()
    const hasMounted = useHasMounted()

    const loaded = hasMounted && poolInfo.isSuccess

    const timestamp = poolInfo.data?.endOfDistribution ?? BigNumber.from(0)

    return (
        <span>
            {
                loaded && timestamp.gt(0)
                    ? new Date(timestamp.toNumber() * 1000).toLocaleString()
                    : "-"
            }
        </span>
    )
}
