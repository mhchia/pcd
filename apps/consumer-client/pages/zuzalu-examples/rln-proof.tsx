import {
  requestZuzaluRLNUrl,
  usePassportResponse,
  usePCDMultiplexer,
  usePendingPCD,
  useRLNProof,
} from "@pcd/passport-interface";
import { useState } from "react";
import { CodeLink, CollapsableCode, HomeLink } from "../../components/Core";
import { ExampleContainer } from "../../components/ExamplePage";
import { PendingPCDStatusDisplay } from "../../components/PendingPCDStatusDisplay";
import {
  PASSPORT_SERVER_URL,
  PASSPORT_URL,
  SEMAPHORE_GROUP_URL,
} from "../../src/constants";
import { requestProofFromPassport } from "../../src/util";
import JSONBig from "json-bigint";

/**
 * Example page which shows how to use a Zuzalu-specific prove screen to
 * request a RLN proof as a third party developer.
 */
export default function Page() {
  const [passportPCDStr, passportPendingPCDStr] = usePassportResponse();
  const [serverProving, setServerProving] = useState(false);
  const [pendingPCDStatus, serverPCDStr] = usePendingPCD(
    passportPendingPCDStr,
    PASSPORT_SERVER_URL
  );
  const pcdStr = usePCDMultiplexer(passportPCDStr, serverPCDStr);
  const { proof, group, valid } = useRLNProof(
    SEMAPHORE_GROUP_URL,
    pcdStr
  );

  return (
    <>
      <HomeLink />
      <h2>Zuzalu RLN Proof</h2>
      <p>
        This page shows a working example of an integration with the Zuzalu
        Passport application which requests and verifies that RLN proof is
        correct.
      </p>
      <p>
        The Zuzalu Residents Semaphore Group is maintained by the Passport
        Server application. To be able to use this flow in production, to be
        able to generate this proof, you have to have signed in on{" "}
        <a href={"https://zupass.org"}>zupass.org</a>. To use this flow locally,
        you either have to sign in as a valid Zuzalu Resident which was synced
        from Pretix, or you have to have started the local development
        environment with the <code>BYPASS_EMAIL_REGISTRATION</code> environment
        variable set to <code>true</code>, which allows you to log in
        development mode without being a resident.
      </p>
      <p>
        The underlying PCD that this example uses is{" "}
        <code>RLNPCD</code>. You can find more documentation
        regarding this PCD{" "}
        <CodeLink file="/tree/main/packages/rln-pcd">
          here on GitHub
        </CodeLink>{" "}
        .
      </p>
      <ExampleContainer>
        <button
          onClick={() => requestZuzaluMembershipProof(serverProving)}
          disabled={valid}
        >
          Request RLN Proof
        </button>
        <label>
          <input
            type="checkbox"
            checked={serverProving}
            onChange={() => {
              setServerProving((checked: boolean) => !checked);
            }}
          />
          server-side proof
        </label>
        {passportPendingPCDStr && (
          <>
            <PendingPCDStatusDisplay status={pendingPCDStatus} />
          </>
        )}
        {proof != null && (
          <>
            <p>Got Zuzalu Membership Proof from Passport</p>
            <CollapsableCode code={JSONBig({ useNativeBigInt: true }).stringify(proof)} />
            {group && <p>✅ Loaded group, {group.members.length} members</p>}
            {valid === undefined && <p>❓ Proof verifying</p>}
            {valid === false && <p>❌ Proof is invalid</p>}
            {valid === true && <p>✅ Proof is valid</p>}
          </>
        )}
        {valid && <p>Welcome, anon</p>}
      </ExampleContainer>
    </>
  );
}

// Show the Passport popup, ask the user to show anonymous membership.
function requestZuzaluMembershipProof(proveOnServer: boolean) {
  const rlnIdentifier = "12345";
  const signal = "1337";
  const epoch = "2";
  const proofUrl = requestZuzaluRLNUrl(
    PASSPORT_URL,
    window.location.origin + "/popup",
    SEMAPHORE_GROUP_URL,
    rlnIdentifier,
    signal,
    epoch,
    proveOnServer
  );

  requestProofFromPassport(proofUrl);
}
