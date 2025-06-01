import React, { useEffect, useState } from "react";
import { useWindowSize } from "@uidotdev/usehooks";
import Confetti from "react-confetti";
import { toCanvas } from "html-to-image";
import html2canvas from "html2canvas";
import {
  FacebookShareButton,
  TwitterShareButton,
  InstapaperShareButton,
  FacebookIcon,
  TwitterIcon,
  InstapaperIcon,
  WeiboShareButton,
  WeiboIcon,
  LineShareButton,
  LineIcon,
  RedditShareButton,
  RedditIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
  EmailShareButton,
  EmailIcon
} from "react-share";
import Confirm from "./confirm";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Modal from "./modal";
import { difficulty } from "@/config";
import { startGame } from "@minesweeper";
import { useSaveScore, useSaveNFT, useGetRandomNumber } from "../hooks/useContract";
import { getRandomNumber } from "@/contracts/contracts";
import { PinataSDK } from 'pinata';
import { isWebview } from "@/utils";
import { useAccount } from 'wagmi';

export const pinata = new PinataSDK({
  pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNDAzOTJjZi01NTEyLTQzODMtOTE5Yy1jMTk5M2Y3MDI0NjEiLCJlbWFpbCI6InRhc25lZW1zaGVyaWYyM0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZGVjYmZhMDRmNGJjZGViYjQ4NWEiLCJzY29wZWRLZXlTZWNyZXQiOiJjZmRhYzExOWVhMDE5ODczMGE3MTJjMGRhODhjNTU0YzNjYjMwMzY3YzdkMjhhYmYyNzYxN2NiMTMwYjAyZTkzIiwiZXhwIjoxNzc5MjIwMTI4fQ.IsWI5Ei_jlnq1zzZam-tnovUqECt9kaoI4PtgMAHdVU",
  pinataGateway: 'chocolate-historic-constrictor-297.mypinata.cloud'
});

const ModalWin = () => {
  const { width, height } = useWindowSize();
  const dispatch = useAppDispatch();
  const { isConnected } = useAccount();
  const status = useAppSelector((store) => store.minesweeper.status);
  const level = useAppSelector((store) => store.userData.level);
  const latestRecord = useAppSelector((store) => store.userData.records[0]);
  const [visible, setVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { saveScore, error: saveError } = useSaveScore();
  const { saveNFT, error: mintError } = useSaveNFT();

  const closeShareModal = () => {
    setVisible(false);
  };

  useEffect(() => {
    setTimeout(() => {
      setVisible(status === "win");
    }, 800);
  }, [status]);

  const handleSaveScore = async () => {
    try {
      setIsSaving(true);
      const levelMap = {
        'beginner': 0,
        'intermediate': 1,
        'expert': 2
      };
      await saveScore(latestRecord.duration, levelMap[level as keyof typeof levelMap]);
    } catch (error) {
      console.error('Failed to save score:', error);
      alert('Failed to save score. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNFT = async () => {
    try {
      setIsSaving(true);

      // Get the screenshot area element
      const node = document.querySelector("#SCREEN_SHOOT_AREA") as HTMLElement;
      if (!node) {
        throw new Error('Screenshot area not found');
      }

      const canvas = await html2canvas(node, {
        logging: process.env.NODE_ENV !== "production",
        allowTaint: true,
        useCORS: true,
        scale: window.devicePixelRatio * (isWebview() ? 2 : 1),
        onclone: (document) => {
          const node = document.querySelector("#SCREENSHOT_AREA .window-body") as HTMLElement;
          if (node) {
            node.style.margin = "0";
            node.style.padding = "8px";
          }
        }
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });

      const file = new File([blob], 'minesweeper-win.png', { type: 'image/png' });

      // Upload to IPFS using Pinata
      const { cid } = await pinata.upload.public.file(file);
      const url = await pinata.gateways.public.convert(cid);

      const metadata = {
        name: `Minesweeper Win - ${level} Level`,
        description: `I won Minesweeper in ${latestRecord.duration} seconds on ${level} mode!`,
        image: url,
        attributes: [
          {
            trait_type: "Level",
            value: level
          },
          {
            trait_type: "Time",
            value: `${latestRecord.duration} seconds`
          }
        ]
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
      const { cid: metadataCid } = await pinata.upload.public.file(metadataFile);
      const metadataUrl = await pinata.gateways.public.convert(metadataCid);

      await saveNFT(metadataUrl);
      // alert('NFT minted successfully!');
      // closeShareModal();
    } catch (error) {
      console.error('Failed to save NFT:', error);
      alert('Failed to save NFT. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayAgain = async () => {
    closeShareModal();
    const randSeed = await getRandomNumber();
    dispatch(
      // @ts-ignore
      startGame({
        difficulty: difficulty[level],
        randSeed
      })
    );
  };

  if (!visible) return null;
  const title = `I just beat #minesweeper in ${latestRecord.duration} seconds on ${level} mode!`;
  return (

    <>
      <Modal id="confetti-modal" mask={false}>
        <Confetti
          className="fixed left-0 top-0 w-full h-full"
          width={width ?? 0}
          height={height ?? 0}
        />
      </Modal>
      <Confirm
        disableCancel
        title="Congratulations!"
        close={closeShareModal}
        content={
          <div className="flex flex-col items-center gap-1">
            <h4>🎉 You have win the game!</h4>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveNFT}
                disabled={isSaving || !isConnected}
                title={!isConnected ? "Please connect your wallet first" : ""}
              >
                {isSaving ? 'Saving...' : 'Save as NFT'}
              </button>
              <button
                type="button"
                onClick={handleSaveScore}
                disabled={isSaving || !isConnected}
                title={!isConnected ? "Please connect your wallet first" : ""}
              >
                {isSaving ? 'Saving...' : 'Save Score onChain'}
              </button>
              <button
                type="button"
                onClick={handlePlayAgain}
                disabled={isSaving}
              >
                Play again
              </button>
            </div>
            {!isConnected && (
              <p className="text-red-500 text-sm mt-2">Please connect your wallet to save your score or mint NFT</p>
            )}
            <fieldset className="mt-4">
              <legend className="m-auto">share it !</legend>
              <ul className="flex items-center flex-wrap gap-2 m-auto">
                <li>
                  <FacebookShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                </li>
                <li>
                  <TwitterShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    related={["wsygc"]}
                    url={window.location.href}
                  >
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                </li>
                <li>
                  <LineShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <LineIcon size={32} round />
                  </LineShareButton>
                </li>
                <li>
                  <LinkedinShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <LinkedinIcon size={32} round />
                  </LinkedinShareButton>
                </li>
                <li>
                  <RedditShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <RedditIcon size={32} round />
                  </RedditShareButton>
                </li>
                <li>
                  <WhatsappShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                </li>
                <li>
                  <EmailShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    content={title}
                    url={window.location.href}
                  >
                    <EmailIcon size={32} round />
                  </EmailShareButton>
                </li>
                <li>
                  <InstapaperShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    content={title}
                    url={window.location.href}
                  >
                    <InstapaperIcon size={32} round />
                  </InstapaperShareButton>
                </li>
                <li>
                  <WeiboShareButton
                    className="flex items-center gap-1 !p-1 !min-w-[unset]"
                    title={title}
                    url={window.location.href}
                  >
                    <WeiboIcon size={32} round />
                  </WeiboShareButton>
                </li>
              </ul>
              <p className="text-left pt-4 text-sm">{title}</p>
            </fieldset>
          </div>
        }
      />
    </>
  );
};

export default ModalWin;