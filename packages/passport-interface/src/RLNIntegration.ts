import { ArgumentTypeName, PCD } from "@pcd/pcd-types";
import {
  deserializeSemaphoreGroup,
  SerializedSemaphoreGroup,
} from "@pcd/semaphore-group-pcd";
import {
  RLNPCDClaim,
  RLNPCDPackage,
  RLNPCDProof
} from "@pcd/rln-pcd";
import { useEffect, useState } from "react";
import { constructPassportPcdGetRequestUrl } from "./PassportInterface";
import { useProof } from "./PCDIntegration";


export function requestZuzaluRLNUrl(
  urlToPassportWebsite: string,
  returnUrl: string,
  urlToSemaphoreGroup: string,
  rlnIdentifier: string,
  signal: string,
  epoch: string,
  proveOnServer?: boolean
) {
  const url = constructPassportPcdGetRequestUrl<
    typeof RLNPCDPackage
  >(
    urlToPassportWebsite,
    returnUrl,
    RLNPCDPackage.name,
    {
      rlnIdentifier: {
        argumentType: ArgumentTypeName.BigInt,
        userProvided: false,
        value: rlnIdentifier ?? "1",
      },
      identity: {
        argumentType: ArgumentTypeName.PCD,
        value: undefined,
        userProvided: true,
      },
      group: {
        argumentType: ArgumentTypeName.Object,
        userProvided: false,
        remoteUrl: urlToSemaphoreGroup,
      },
      signal: {
        argumentType: ArgumentTypeName.String,
        userProvided: false,
        value: signal ?? "1",
      },
      epoch: {
        argumentType: ArgumentTypeName.BigInt,
        userProvided: false,
        value: epoch ?? "1",
      },
    },
    {
      proveOnServer: proveOnServer,
    }
  );

  return url;
}

export function useRLNProof(
  semaphoreGroupUrl: string,
  proofStr: string
) {
  const [error, setError] = useState<Error | undefined>();
  const rlnProof = useProof(RLNPCDPackage, proofStr);

  // Meanwhile, load the group so that we can verify against it
  const [semaphoreGroup, setGroup] = useState<SerializedSemaphoreGroup>();
  useEffect(() => {
    (async () => {
      if (!rlnProof) return;

      try {
        const res = await fetch(semaphoreGroupUrl);
        const json = await res.text();
        const group = JSON.parse(json) as SerializedSemaphoreGroup;
        setGroup(group);
      } catch (e) {
        setError(e as Error);
      }
    })();
  }, [rlnProof, semaphoreGroupUrl]);

  // Verify the proof
  const [semaphoreProofValid, setValid] = useState<boolean | undefined>();
  useEffect(() => {
    if (rlnProof && semaphoreGroup) {
      verifyRLNProof(rlnProof, semaphoreGroup).then(setValid);
    }
  }, [rlnProof, semaphoreGroup, setValid]);

  return {
    proof: rlnProof,
    group: semaphoreGroup,
    valid: semaphoreProofValid,
    error,
  };
}

async function verifyRLNProof(
  pcd: PCD<RLNPCDClaim, RLNPCDProof>,
  serializedExpectedGroup: SerializedSemaphoreGroup
): Promise<boolean> {
  const { verify } = RLNPCDPackage;
  const verified = await verify(pcd);
  if (!verified) return false;

  const expectedGroup = deserializeSemaphoreGroup(serializedExpectedGroup);
  const merkleRoot = pcd.claim.merkleRoot;

  return expectedGroup.root.toString() === merkleRoot.toString();
}
