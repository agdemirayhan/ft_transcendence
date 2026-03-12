"use client";

import React, { useMemo, useState } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

type PostType = {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  liked: boolean;
};

const seedPosts: PostType[] = [
  {
    id: 1,
    author: "Ayhan",
    handle: "@ayhan",
    time: "2s ago",
    content: "First post! 🎉 I'm building a simple social media page.",
    likes: 3,
    liked: false,
  },
  {
    id: 2,
    author: "Taha",
    handle: "@tkirmizi",
    time: "5m ago",
    content: "Building small UIs with React is really enjoyable.",
    likes: 7,
    liked: true,
  },
];

function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
  }, [name]);

  return <div className="avatar">{initials.toUpperCase()}</div>;
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      {children}
    </div>
  );
}

function PostComposer({ onPost }: { onPost: (content: string) => void }) {
  const [text, setText] = useState("");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onPost(trimmed);
    setText("");
  }

  return (
    <Card>
      <form onSubmit={submit} className="composer">
        <div className="composerTop">
          <Avatar name="You" />
          <textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="textarea"
            placeholder="What's happening?"
            rows={3}
            maxLength={240}
          />
        </div>

        <div className="composerBottom">
          <span className="muted">{text.length}/240</span>
          <button className="btn" type="submit">
            Post
          </button>
        </div>
      </form>
    </Card>
  );
}

function Post({
  post,
  onToggleLike,
}: {
  post: PostType;
  onToggleLike: (id: number) => void;
}) {
  return (
    <div className="post">
      <Avatar name={post.author} />
      <div className="postBody">
        <div className="postHeader">
          <div className="postAuthor">
            <span className="name">{post.author}</span>
            <span className="handle">{post.handle}</span>
            <span className="dot">•</span>
            <span className="time">{post.time}</span>
          </div>
        </div>

        <div className="postContent">{post.content}</div>

        <div className="postActions">
          <button
            className={`iconBtn ${post.liked ? "liked" : ""}`}
            onClick={() => onToggleLike(post.id)}
            aria-label="Like"
            type="button"
          >
            <HeartSolid className={`icon ${post.liked ? "liked" : ""}`} />
          </button>
          <span className="muted">{post.likes}</span>

          <span className="spacer" />

          <button
            className="ghostBtn"
            onClick={() => alert("We'll add this later 🙂")}
            type="button"
          >
            Comment
          </button>
          <button
            className="ghostBtn"
            onClick={() => alert("We'll add this later 🙂")}
            type="button"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>(seedPosts);

  function addPost(content: string) {
    const newPost: PostType = {
      id: Date.now(),
      author: "You",
      handle: "@you",
      time: "just now",
      content,
      likes: 0,
      liked: false,
    };
    setPosts((p) => [newPost, ...p]);
  }

  function toggleLike(id: number) {
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== id) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      })
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand"><img src="/favicon-32x32.png" alt="miniSocial" width={32} height={32} /></div>
        <input className="search" placeholder="Search..." />
        <button className="btn btnSmall" onClick={() => alert("Login later 🙂")} type="button">
          Login
        </button>
      </header>

      <main className="layout">
        <aside className="volume" />

        <aside className="left">
          <Card title="Profile">
            <div className="profile">
              <Avatar name="Ayhan" />
              <div>
                <div className="profileName">Ayhan</div>
                <div className="muted">@ayhan</div>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="statNum">12</div>
                <div className="muted">Posts</div>
              </div>
              <div className="stat">
                <div className="statNum">340</div>
                <div className="muted">Followers</div>
              </div>
              <div className="stat">
                <div className="statNum">180</div>
                <div className="muted">Following</div>
              </div>
            </div>

            <button className="btn btnWide" onClick={() => alert("Edit later 🙂")} type="button">
              Edit Profile
            </button>
          </Card>

          <Card title="Shortcuts">
            <div className="list">
              <button className="linkBtn" type="button">
                Feed
              </button>
              <button className="linkBtn" type="button">
                Explore
              </button>
              <button className="linkBtn" type="button">
                Messages
              </button>
              <button className="linkBtn" type="button">
                Settings
              </button>
            </div>
          </Card>
        </aside>

        <section className="center">
          <PostComposer onPost={addPost} />
          <div className="feed">
            {posts.map((p) => (
              <Card key={p.id}>
                <Post post={p} onToggleLike={toggleLike} />
              </Card>
            ))}
          </div>
        </section>

        <aside className="right">
          <Card title="Trending">
            <div className="chips">
              <span className="chip">#react</span>
              <span className="chip">#frontend</span>
              <span className="chip">#42school</span>
              <span className="chip">#nextjs</span>
            </div>
          </Card>

          <Card title="Suggestions">
            <div className="suggestions">
              {[
                { name: "Manuel", handle: "@mhummel" },
                { name: "Taha", handle: "@tkirmizi" },
                { name: "Leon", handle: "@ldick" },
              ].map((u) => (
                <div className="suggestion" key={u.handle}>
                  <div className="row">
                    <Avatar name={u.name} />
                    <div>
                      <div className="name">{u.name}</div>
                      <div className="muted">{u.handle}</div>
                    </div>
                  </div>
                  <button
                    className="btn btnSmall"
                    onClick={() => alert(`${u.name} followed (fake) 🙂`)}
                    type="button"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <aside className="volume" />
      </main>

      <footer className="footer muted">miniSocial • React starter • we’ll migrate to Next.js later</footer>
    </div>
  );
}