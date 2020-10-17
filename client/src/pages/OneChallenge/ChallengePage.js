import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import network from "../../services/network";
import { Button } from "@material-ui/core";
import Rating from "@material-ui/lab/Rating";
import Chip from "@material-ui/core/Chip";
import "./ChallengePage.css";
import SubmitModal from "../../components/SubmitModal/SubmitModal";
import ReviewsTab from "../../components/InfoTable/Tabs/ReviewsTab/ReviewsTab";
import "./ChallengePage.css";
import Cookies from "js-cookie";

function generateTime(date) {
  let today = new Date(date);
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  today = `${yyyy}-${mm}-${dd}`;
  return `${today}`;
}

function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const { id } = useParams();
  const [image, setImage] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getUpdated = useCallback((date) => {
    const dateNow = Date.now();
    const updateRepoDate = new Date(date);
    let diff = (dateNow - updateRepoDate.getTime()) / 1000 / 60 / 60;
    if (diff < 24) {
      setDate(`${Math.floor(diff)} Hours ago`);
    } else {
      diff = diff / 24;
      diff = Math.floor(diff);
      if (diff < 8) {
        setDate(`${Math.floor(diff)} Days ago`);
      } else {
        diff = Math.floor(diff / 7);
        if (diff < 5) {
          setDate(`${Math.floor(diff)} Weeks ago`);
        } else {
          diff = Math.floor(diff / 4);
          if (diff < 13) {
            setDate(`${Math.floor(diff)} Months ago`);
          } else {
            diff = Math.floor(diff / 12);
            setDate(`${Math.floor(diff)} Years ago`);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const getSubmissionInterval = setInterval(async () => {
      const { data: submission } = await network.get(
        `/api/v1/challenges/${id}/${Cookies.get("userName")}/submission`
      );
      if (submission) {
        setSubmissionStatus({
          state: submission.state,
          createdAt: submission.createdAt,
        });
      } else {
        setSubmissionStatus(null);
      }
    }, 5000);
    const setImg = async () => {
      try {
        const { data } = await network.get(`/api/v1/image?id=${id}`);
        setImage(data.img);
      } catch (error) {}
    };
    const fetchChallenge = async () => {
      try {
        let {
          data: { challenge: challengeFromServer },
        } = await network.get(`/api/v1/challenges/${id}`);
        setChallenge(challengeFromServer);
        setRating(
          typeof challengeFromServer.Reviews[0] === "object"
            ? Math.round(challengeFromServer.Reviews[0].averageRating)
            : 0
        );
        try {
          const { data: repo } = await network.get(
            `/api/v1/services/public_repo?repo_name=${challengeFromServer.repositoryName}`
          );
          const updateDate = repo.updated_at;
          getUpdated(updateDate);
        } catch (e) {
          setDate(generateTime(challenge.createdAt));
        }
      } catch (error) {}
    };
    setImg();
    fetchChallenge();
    return () => clearInterval(getSubmissionInterval);
    // eslint-disable-next-line
  }, [id]);

  function handleModalClose() {
    setIsModalOpen(false);
  }

  const getSubmissionStatus = () => {
    if (!submissionStatus) {
      return (
        <div>
          <p>
            You have not submitted any solution to this challenge yet,
            challenger! Prove your worth.
          </p>
        </div>
      );
    } else if (submissionStatus.state === "SUCCESS") {
      return (
        <div>
          <p>
            {`
            You have already solved this challenge on ${generateTime(
              submissionStatus.createdAt
            )} You can submit
            another solution if you’d like:
              `}
          </p>
        </div>
      );
    } else if (submissionStatus.state === "PENDING") {
      return (
        <div>
          <p>Your submission is being tested</p>
        </div>
      );
    } else {
      return (
        //fail
        <div>
          <p>
            {`You have already solved this challenge on ${generateTime(
              submissionStatus.createdAt
            )} You can submit another solution if you’d like:`}
          </p>
        </div>
      );
    }
  };

  return challenge ? (
    <div style={{ overflowY: "auto", height: "100vh", width: "100%" }}>
      <div className='one-challenge-container'>
        <div className='one-challenge-info'>
          <h1 className='one-challenge-info-title'>
            <b>{challenge.name}</b>
          </h1>
          <img className='one-challenge-info-image' src={image} alt='' />
          <div className='one-challenge-description'>
            <b>Description:</b>
            <br />
            {challenge.description}

            <div className='one-challenge-author'>
              Created by: {challenge.Author.userName}
            </div>
            <div className='one-challenge-uploaded-at'>
              Created At: {generateTime(challenge.createdAt) + " "}
            </div>
            <div className='one-challenge-updated-at'>
              Updated At: {date ? date : ""}
            </div>
            <div className='one-challenge-rating'>
              <Rating
                name='half-rating-read'
                value={rating}
                readOnly
                size='large'
              />
            </div>
            <div className='challenge-label'>
              {challenge["Labels"] &&
                challenge["Labels"].map((label) => (
                  <Link
                    key={label.id}
                    to={`/?labelId=${label["LabelChallenge"]["labelId"]}`}
                  >
                    <Chip color='primary' label={label.name} component='a' />
                  </Link>
                ))}
            </div>
          </div>
          <Button
            color='primary'
            href={`https://github.com/${challenge.boilerPlate}`}
            target='_blank'
          >
            Start this challenge
          </Button>
        </div>
        <div className='one-challenge-reviews-and-submissions'>
          <div className='one-challenge-submission-container'>
            <div className='one-challenge-submit-btn'>
              <div className='submission-status'>{getSubmissionStatus()}</div>
              <Button color='primary' onClick={() => setIsModalOpen(true)}>
                Submit
              </Button>
            </div>
            <SubmitModal
              isOpen={isModalOpen}
              handleClose={handleModalClose}
              challengeParamId={id}
            />
          </div>
          <div className='one-challenge-reviews-container'>
            <ReviewsTab challengeId={challenge.id} />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <h1>loading</h1>
  );
}

export default ChallengePage;