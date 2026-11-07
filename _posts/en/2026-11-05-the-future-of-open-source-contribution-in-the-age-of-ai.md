---
layout: post
title: "The future of open source contribution in the age of AI"
date: 2026-11-05 10:00:00 -0300
categories: [ia]
tags: [open-source, ia, home-assistant, smartir]
stage: growing
description: "AI is shortening the distance between finding a bug and sending the fix. From the Linux kernel to my own contribution to SmartIR, what changes for contributors, for reviewers and for what counts as a contribution."
image: /assets/images/futuro-contribuicao-open-source/patrocinar-em-tokens.png
translation_key: o-futuro-da-contribuicao-open-source-na-era-da-ia
---

For a long time, contributing to an open source project felt like something for insiders. You had to understand a huge codebase, figure out conventions nobody had documented, set up the development environment and, after all that, find the nerve to open a pull request for someone you didn't know.

A lot of good people gave up halfway, because the distance between *"I found a bug"* and *"I sent the fix"* was just too long. That distance is shrinking fast.

## When AI becomes the "senior colleague" you never had

Besides writing code, AI explains code. You open an unfamiliar repository and ask: "where is this value calculated?", "why is this state never updated?", "how do I test this?". The context that used to take weeks to absorb now comes in a conversation.

That changes who can contribute. The person who uses the software every day, knows the problem up close and can reproduce the bug is now able to carry the fix all the way through. Before, they could often only open an issue and hope.

## The large-scale example: Anthropic and Linux

In 2026, Nicholas Carlini, a researcher at Anthropic, showed a simple experiment at a security conference: a script that ran Claude Code over every file in the Linux kernel, looking for bugs. One of them was a remotely exploitable *heap buffer overflow* in the NFS driver that had been there since 2003, 23 years without anyone noticing. In total, he confirmed five vulnerabilities, in NFS, io_uring, futex and ksmbd, and all of them already have commits in the kernel's stable tree.

In April, Anthropic launched Project Glasswing, with partners such as the Linux Foundation, Microsoft, Apple, Amazon, Cisco and CrowdStrike. The company committed up to US$100 million in usage credits and US$4 million in direct donations to open source security organizations. According to Anthropic, the model used in the project, Claude Mythos Preview, found thousands of previously unknown vulnerabilities, including a 27-year-old bug in OpenBSD and a 16-year-old one in FFmpeg. Two weeks after the model was released to the partners, Mozilla announced it had found and fixed 271 vulnerabilities in Firefox with it.

For a sense of scale: Linux runs on servers, Android phones, routers, cars and most of the internet's infrastructure. A bug fixed there protects people who will never know it existed. But finding is moving faster than fixing. Patrick Garrity, quoted on the Claude Mythos Wikipedia page, estimated that by September "only 10% of discovered flaws had been disclosed and less than 1% had been fixed."

## Now at a small scale: my contribution to SmartIR

I'm not a security researcher or a kernel maintainer, but I lived a small version of the same story.

I use [SmartIR](https://github.com/smartHomeHub/SmartIR), a Home Assistant integration that controls devices over infrared, like air conditioners, TVs and fans. With Home Assistant 2026.11.0, SmartIR's `climate` and `fan` platforms stopped loading, and no air conditioner entity was created. The log showed an `ImportError`: Home Assistant had removed the `async_track_state_change` function from `homeassistant.helpers.event`. SmartIR 1.18.1 already used the replacement, `async_track_state_change_event`, throughout the code, but `climate.py` and `fan.py` still imported the old name without using it.

Before, I would probably have opened an issue and waited. This time, I used AI to understand how the component worked, find where the problem was and write the fix, which was removing the old name from the import in both files. I opened the [issue](https://github.com/smartHomeHub/SmartIR/issues/1608) with the error and the cause and, in the same minute, the [pull request](https://github.com/smartHomeHub/SmartIR/pull/1609). Half an hour later, the maintainer merged it and replied with a "Thanks!".

It was one changed line in each file. I'm an experienced programmer, so writing that line was never the hard part. The hard part was finding the time to understand code that isn't mine, which is why I'd probably have stopped at the issue. AI shortened that part, and the fix now works for everyone who has the same problem. And I think that today someone who doesn't program, but uses SmartIR and can reproduce the bug, could follow the same path with AI's help: understand the error, find the line and open the PR.

## The big debate: accept AI code or not?

Not everyone welcomed this change. Since 2024, the open source community has been divided.

Some projects closed the door. In April 2024, Gentoo banned content created with the assistance of AI tools. NetBSD started treating LLM-generated code as "presumed to be tainted". QEMU declines any contribution believed to include or derive from AI-generated content. In 2026, OpenJDK approved an interim policy saying that contributions "must not include content generated, in part or in full, by large language models".

Others tightened their rules because of so-called *AI slop*, the stream of PRs and reports generated without care. curl ended its bug bounty program in January 2026, after the rate of valid reports dropped from about 15% to under 5%. Ghostty banned AI-made PRs from people just passing through, without an already accepted issue. tldraw started closing external PRs automatically.

And some accepted it and wrote rules. Apache allows AI use and leaves it to the contributor to check copyright and licensing for anything that isn't their own work. typescript-eslint wrote that it "cannot and will not attempt to ban" contributions that make use of AI. The biggest open source project in the world went the same way.

## Even Linus

The Linux kernel has an official policy on AI coding assistants. AI can help, but it doesn't sign anything. Only a human can add the `Signed-off-by`, and that person takes responsibility for the code, reviews everything the AI generated and makes sure the license is compatible. The kernel guidelines on tool-generated content ask for transparency about where the code came from: "If in doubt, choose transparency."

In October 2026, at the Maintainers Summit in Prague, Sasha Levin announced that the maintainers had decided to deprecate the `Assisted-by` tag, which marked patches made with AI help. In practice, contributors no longer need to declare that they used AI. The way I read it, review now looks only at the code.

Linus Torvalds, who used to be skeptical of AI-generated code, has started using it too. He developed eight changes with Claude Code to fix a performance problem in the kernel, and their documentation says the code, the test programs and the review were produced "with the help of an LLM coding assistant (Claude Code) under my supervision". The changes are still experimental and haven't made it into the official kernel. He said: "I used to think the technology just wasn't very good. But now I've reached a point where I really enjoy using AI."

In a note to a columnist at The Register, he wrote:

> "I really think we _want_ competent people to use AI as a tool."

At Open Source Summit Europe, he said he loves the idea of AI as a gateway into programming, with one caveat: he wants to discourage *drive-by* patches from people who just want to say they sent a patch and never meant to stick around. "We all start clueless, but some people spend the time and effort to become something more."

In early November, when he released 7.4-rc1, the first release candidate for kernel 7.4, Linus described it as "Large, and full of fixes for issues found by AI (and more and more the patches have been suggested by AI too, although they often get rewritten)". The merge window had almost 20,000 commits, compared with the usual ~15,000.

## The part that needs care

Contributing got easier, and reviewing didn't. Greg Kroah-Hartman said that months ago the kernel was getting what they called "AI slop": AI-generated security reports that were obviously wrong or low quality. Now the maintainers are buried in good reports. Good or bad, someone has to read each one, and that someone is still a person, often a volunteer.

With review becoming the bottleneck, the contributor's responsibility grows:

- Understand what you're sending. AI helps you write it, but the PR is yours. If you can't explain the change, it isn't ready.
- Test for real: reproduce the bug before and confirm it's gone after.
- Read the contribution guide, follow the code style and explain the change clearly in the description.
- Say you used AI, even where it isn't required. For the reviewer, it's context.
- After opening the PR, stay around to answer the review and adjust what's asked. That's the opposite of a drive-by patch.

## The next currency of contribution: tokens

For decades, the people who contributed to open source were the ones who knew how to program and had free time. If you lacked one of those, the most you could do was open an issue or donate some money.

If the technical barrier falls, the scarce resource becomes the cost of running AI. An agent that investigates a bug, writes the fix and runs the tests consumes tokens, and tokens cost money.

I think contributing will look more and more like funding compute. Instead of "I'll spend my weekend on this project", someone will say "I'll pay for X million tokens for this project". Agents do the heavy lifting, and people set priorities, review and decide what goes in.

Project Glasswing already works this way, at a large scale. Anthropic didn't hire an army of engineers to audit Linux, OpenBSD and FFmpeg. It offered up to US$100 million in usage credits, which means it contributed tokens.

That raises a few questions:

- Who decides where the tokens are spent? The maintainers, whoever pays, or the community voting on issues?
- What happens to recognition? Today the credit goes to whoever writes the code. Tomorrow, does it go to whoever pays for the compute, whoever wrote the right prompt, or whoever reviewed it?
- Does this concentrate power? If contributing depends on money, big companies may gain even more influence over projects.
- What about human time? I think it moves to what AI still doesn't do well: deciding where the project goes, reviewing with judgment and keeping the community healthy.

Maybe the future of "how can I help this project?" is a token sponsorship button next to the star button on GitHub. And maybe the biggest gesture from someone who likes a project will be pointing their AI quota at its bug queue.

![Illustration of an open source repository page with the Star and Fork buttons and a third button, "Patrocinar em tokens" (sponsor in tokens), open in a menu with the options point 1,000,000 tokens at the bug queue, 500,000 at reviewing open PRs and 250,000 at writing tests](/assets/images/futuro-contribuicao-open-source/patrocinar-em-tokens.png)

## Where this is going

I don't see AI use in software development going back. The projects that ban it today have legitimate reasons, like licensing doubts and too much junk to review. But the question is shifting from *"should we accept AI?"* to *"how do we make sure the code is good, wherever it comes from?"*. The kernel has already answered: responsibility always belongs to a person.

The line between user and contributor is going to get thinner. People who feel the problem will be able to fix it, even without knowing the project's code from the inside. Small projects that never had many maintainers will get help from people who used to just complain in silence, and the people who look after them will need time to review all of it.

## References

- [Claude Code Used to Find Remotely Exploitable Linux Kernel Vulnerability Hidden for 23 Years, InfoQ](https://www.infoq.com/news/2026/04/claude-code-linux-vulnerability/)
- [Tech giants launch AI-powered 'Project Glasswing' to identify critical software vulnerabilities, CyberScoop](https://cyberscoop.com/project-glasswing-anthropic-ai-open-source-software-vulnerabilities/)
- [Claude Mythos, Wikipedia](https://en.wikipedia.org/wiki/Claude_Mythos)
- [Linus Torvalds has started using AI to develop the Linux kernel, Computerworld](https://www.computerworld.com/article/4235401/linus-torvalds-has-started-using-ai-to-develop-the-linux-kernel.html)
- [Torvalds: AI is fine for competent devs, but spare us the 'drive-by' patches, The Register](https://www.theregister.com/columnists/2026/10/23/torvalds-ai-is-fine-for-competent-devs-but-spare-us-the-drive-by-patches/5304357)
- [Linus Torvalds says Linux kernel is out of 'stabilization phase' and using 'much healthier model' for AI contributions, The Register](https://www.theregister.com/os-platforms/2026/11/01/linus-torvalds-says-linux-kernel-is-out-of-stabilization-phase-and-using-much-healthier-model-for-ai-contributions/5306852)
- [AI Coding Assistants, official Linux kernel documentation](https://docs.kernel.org/process/coding-assistants.html)
- [Kernel Guidelines for Tool-Generated Content, official Linux kernel documentation](https://docs.kernel.org/process/generated-content.html)
- [How OSS Contribution Policies Changed in Response to AI Slop, Codenote](https://codenote.net/en/posts/oss-ai-slop-contribution-policy-shift/)
- [OpenJDK Will Not Take AI-Generated Code. Five Projects, Five Different Lines, Builtplain](https://builtplain.com/open-source-ai-contribution-policies/)
- [SmartIR on GitHub](https://github.com/smartHomeHub/SmartIR), with [issue #1608](https://github.com/smartHomeHub/SmartIR/issues/1608) and [PR #1609](https://github.com/smartHomeHub/SmartIR/pull/1609)
